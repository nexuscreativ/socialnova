@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke all refresh tokens for the current user and audit the event.

    The web client sends a Bearer token; the refresh token row for that
    user is revoked, signing the user out.  The action is always logged.
    """
    count = await revoke_all_user_tokens(db, user.id)
    await db.commit()

    await log_audit_event(
        db, action="user.logout", user_id=user.id,
        resource_type="user", resource_id=user.id,
        details={"tokens_revoked": count},
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return MessageResponse(message="Logged out successfully")