"""
One-off admin provisioning tool.

Creates (or promotes) a verified superadmin in the target database.

Usage (from apps/api, with a tunnel to the DB active):

    python scripts/create_admin.py --email admin@example.com --password 'Str0ng!Pass'

The script reads DATABASE_URL from the environment like the app itself, so it
works unchanged against Fly via `fly proxy` or locally via .env.
"""
import argparse
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select  # noqa: E402

from database import AsyncSessionLocal, _normalize_db_url  # noqa: E402
from models import User  # noqa: E402
from services.auth import hash_password  # noqa: E402

PROMPT = (
    "Creating or promoting a {role} is a privileged operation.\n"
    "Confirm this email is correct: {email}\n"
    "Type 'yes' to continue: "
)


async def main() -> None:
    parser = argparse.ArgumentParser(description="Provision a superadmin account")
    parser.add_argument("--email", required=True, help="Email for the admin account")
    parser.add_argument("--password", required=True, help="Password for the admin account")
    parser.add_argument(
        "--non-interactive",
        action="store_true",
        help="Skip the confirmation prompt (for automation)",
    )
    args = parser.parse_args()

    email = args.email.lower().strip()
    if not args.non_interactive:
        answer = input(PROMPT.format(role="superadmin", email=email))
        if answer.strip().lower() != "yes":
            print("Aborted.")
            return

    async with AsyncSessionLocal() as session:
        existing = await session.scalar(select(User).where(User.email == email))
        if existing:
            existing.role = "superadmin"
            existing.tier = existing.tier or "enterprise"
            existing.is_active = True
            print(f"Promoted existing user {email!r} to superadmin (uid={existing.id}).")
        else:
            session.add(
                User(
                    email=email,
                    name="Administrator",
                    password_hash=hash_password(args.password),
                    is_verified=True,
                    is_active=True,
                    role="superadmin",
                    tier="enterprise",
                )
            )
            print(f"Created superadmin {email!r}.")
        await session.commit()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(130)