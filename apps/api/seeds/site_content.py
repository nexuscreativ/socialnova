"""
Idempotent seed data for the CMS.

Defines default marketing pages + their ordered sections. Existing rows are
left untouched (slug match), so repeated boots / deploys never clobber edits.
"""
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import SitePage, SiteSection

# ─── Section payload builders ───────────────────────────────────────────────


def _hero(title: str, sub: str, cta: str = "Start Free") -> Dict[str, Any]:
    return {
        "badge": "AI-Powered Social Media Management",
        "headline": title,
        "subheadline": sub,
        "primary_cta": {"label": cta, "href": "/signup"},
        "secondary_cta": {"label": "Watch Demo", "href": "/demo"},
        "stats": [],
    }


def _features(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    return {
        "heading": "Everything you need to win on social",
        "subheading": "Six core pillars powering your social media strategy.",
        "items": items,
    }


def _pricing() -> Dict[str, Any]:
    return {
        "heading": "Simple, transparent pricing",
        "subheading": "Start free. Scale when you're ready.",
        "tiers": [
            {
                "name": "Free",
                "price": "$0",
                "period": "/mo",
                "description": "Perfect for getting started with AI-powered social media",
                "features": [
                    "5 posts per month",
                    "2 platform connections",
                    "Basic AI content suggestions",
                    "Standard scheduling",
                    "Community support",
                ],
                "cta": "Start Free",
                "popular": False,
            },
            {
                "name": "Pro",
                "price": "$29",
                "period": "/mo",
                "description": "For creators and small businesses ready to scale",
                "features": [
                    "Unlimited posts",
                    "6 platform connections",
                    "All 12 AI agents",
                    "Advanced analytics dashboard",
                    "Smart scheduling & optimization",
                    "Priority email support",
                ],
                "cta": "Get Pro",
                "popular": True,
            },
            {
                "name": "Enterprise",
                "price": "Custom",
                "period": "",
                "description": "For teams and agencies with advanced needs",
                "features": [
                    "Everything in Pro",
                    "Custom AI agents",
                    "API access",
                    "Team collaboration",
                    "Dedicated account manager",
                ],
                "cta": "Contact Sales",
                "popular": False,
            },
        ],
    }


def _faq() -> Dict[str, Any]:
    return {"heading": "Frequently asked questions", "items": []}


def _cta(heading: str, sub: str) -> Dict[str, Any]:
    return {
        "heading": heading,
        "subheading": sub,
        "primary_cta": {"label": "Start Free", "href": "/signup"},
    }


def _article(body: str) -> Dict[str, Any]:
    return {"heading": "", "body": body}


# ─── Default pages ──────────────────────────────────────────────────────────

_PAGE_SPECS: List[Dict[str, Any]] = [
    {
        "slug": "features",
        "title": "Features",
        "nav_label": "Features",
        "nav_order": 2,
        "description": "Everything SocialNova gives you to run social media on autopilot.",
        "sections": [
            {
                "order": 0,
                "section_key": "hero",
                "payload": _hero(
                    "Powerful features for modern social teams",
                    "From AI content generation to revenue attribution, SocialNova's twelve specialized agents cover the entire lifecycle.",
                ),
            },
            {
                "order": 1,
                "section_key": "features",
                "payload": _features(
                    [
                        {"title": "12 AI Agents", "description": "Specialized agents for content, scheduling, ads, CRM, analytics, and more.", "icon": "bot"},
                        {"title": "Smart Scheduling", "description": "AI determines optimal posting times for each platform and audience.", "icon": "calendar"},
                        {"title": "Revenue Attribution", "description": "Track which posts drive DMs, leads, and actual revenue.", "icon": "barchart"},
                        {"title": "Social CRM", "description": "Unified inbox with lead scoring and automated follow-ups.", "icon": "message"},
                        {"title": "Brand Guardian", "description": "Automated quality checks ensure consistent brand voice.", "icon": "shield"},
                        {"title": "Agent Factory", "description": "Create custom agents from templates in minutes, not months.", "icon": "zap"},
                    ]
                ),
            },
            {
                "order": 2,
                "section_key": "faq",
                "payload": _faq(),
            },
            {
                "order": 3,
                "section_key": "cta",
                "payload": _cta(
                    "Ready to put your social media on autopilot?",
                    "Join thousands of creators and teams building faster with SocialNova.",
                ),
            },
        ],
    },
    {
        "slug": "pricing",
        "title": "Pricing",
        "nav_label": "Pricing",
        "nav_order": 3,
        "description": "Simple, transparent pricing that scales with you.",
        "sections": [
            {
                "order": 0,
                "section_key": "hero",
                "payload": _hero(
                    "Pricing that scales with you",
                    "Start free, upgrade when you're ready. No hidden fees, cancel anytime.",
                ),
            },
            {"order": 1, "section_key": "pricing", "payload": _pricing()},
            {
                "order": 2,
                "section_key": "faq",
                "payload": _faq(),
            },
            {
                "order": 3,
                "section_key": "cta",
                "payload": _cta(
                    "Still deciding?",
                    "Talk to our team and we'll help you pick the right plan.",
                ),
            },
        ],
    },
    {
        "slug": "about",
        "title": "About",
        "nav_label": "About",
        "nav_order": 6,
        "description": "The story behind SocialNova and our mission.",
        "sections": [
            {
                "order": 0,
                "section_key": "hero",
                "payload": _hero(
                    "We're building social media's autopilot",
                    "SocialNova was founded on a simple belief: teams shouldn't spend hours on the mechanics of social media.",
                ),
            },
            {
                "order": 1,
                "section_key": "article",
                "payload": _article(
                    "Our mission is to give every creator and marketer a full team of AI specialists that plans, writes, schedules, and optimizes content across every platform — so people can focus on the work that actually matters.\n\nToday we power publishing for thousands of brands, and we're just getting started."
                ),
            },
            {
                "order": 2,
                "section_key": "stats",
                "payload": {
                    "heading": "SocialNova in numbers",
                    "stats": [
                        {"label": "Posts generated", "value": 4000000, "suffix": "+"},
                        {"label": "Platforms", "value": 6, "suffix": "+"},
                        {"label": "Uptime", "value": 99.9, "suffix": "%"},
                    ],
                },
            },
            {
                "order": 3,
                "section_key": "cta",
                "payload": _cta(
                    "Come build the future with us",
                    "We're hiring. Explore open roles and join the team.",
                ),
            },
        ],
    },
    {
        "slug": "integrations",
        "title": "Integrations",
        "nav_label": "Integrations",
        "nav_order": 4,
        "description": "Connect every platform you already use.",
        "sections": [
            {
                "order": 0,
                "section_key": "hero",
                "payload": _hero(
                    "Your stack, already connected",
                    "SocialNova plugs into the platforms and tools you already use.",
                ),
            },
            {
                "order": 1,
                "section_key": "integrations",
                "payload": {
                    "heading": "Works with your favorite platforms",
                    "subheading": "Native integrations for all major social networks.",
                    "items": [
                        {"name": "Instagram", "description": "Reels, Stories, and feed posts"},
                        {"name": "Twitter / X", "description": "Threads, polls, and scheduling"},
                        {"name": "LinkedIn", "description": "Company pages and professional content"},
                        {"name": "TikTok", "description": "Short-form video at scale"},
                        {"name": "YouTube", "description": "Publishing and optimization"},
                        {"name": "Facebook", "description": "Pages, groups, and ads"},
                    ],
                },
            },
            {
                "order": 2,
                "section_key": "cta",
                "payload": _cta(
                    "Seamlessly connected",
                    "Set up all your platforms in minutes, not days.",
                ),
            },
        ],
    },
    {
        "slug": "blog",
        "title": "Blog",
        "nav_label": "Blog",
        "nav_order": 5,
        "description": "Product updates, tips, and stories from the SocialNova team.",
        "sections": [
            {
                "order": 0,
                "section_key": "hero",
                "payload": _hero(
                    "The SocialNova Blog",
                    "Insights and updates on AI-powered social media management.",
                ),
            },
            {
                "order": 1,
                "section_key": "article",
                "payload": _article(
                    "New to SocialNova? Start with the essentials:\n\n• Tour the dashboard to meet your twelve AI agents.\n• Connect your first two platforms on the Free plan.\n• Let Nova draft your first month of content.\n\nArticles and guides are posted here regularly."
                ),
            },
        ],
    },
    {
        "slug": "guides",
        "title": "Guides",
        "nav_label": "Guides",
        "description": "Step-by-step guides for getting the most out of SocialNova.",
        "sections": [
            {
                "order": 0,
                "section_key": "hero",
                "payload": _hero(
                    "Guides & How-To's",
                    "Practical walkthroughs for every part of SocialNova.",
                ),
            },
            {
                "order": 1,
                "section_key": "article",
                "payload": _article(
                    "Getting Started Guide\n=====================\n\n1. Create your account and verify your email.\n2. Connect a social platform under Settings.\n3. Open the chat and ask Nova to plan your week.\n4. Review, approve, and let the agents publish.\n\nMore detailed guides are being published every week."
                ),
            },
        ],
    },
    {
        "slug": "help",
        "title": "Help Center",
        "nav_label": "Help Center",
        "description": "Answers to common questions and how to reach support.",
        "sections": [
            {
                "order": 0,
                "section_key": "hero",
                "payload": _hero(
                    "How can we help?",
                    "Browse common questions or reach our support team directly.",
                ),
            },
            {"order": 1, "section_key": "faq", "payload": _faq()},
            {
                "order": 2,
                "section_key": "cta",
                "payload": _cta(
                    "Still need help?",
                    "Email support@socialnova.ai and we'll respond within 24 hours.",
                ),
            },
        ],
    },
    {
        "slug": "contact",
        "title": "Contact",
        "nav_label": "Contact",
        "nav_order": 7,
        "description": "Get in touch with the SocialNova team.",
        "sections": [
            {
                "order": 0,
                "section_key": "hero",
                "payload": _hero(
                    "Let's talk",
                    "Questions, sales, partnerships, or press — we'd love to hear from you.",
                ),
            },
            {
                "order": 1,
                "section_key": "cta",
                "payload": {
                    "heading": "Email us anytime",
                    "subheading": "hello@socialnova.ai · sales@socialnova.ai · press@socialnova.ai",
                    "primary_cta": {"label": "Email Now", "href": "mailto:hello@socialnova.ai"},
                },
            },
        ],
    },
    {
        "slug": "privacy",
        "title": "Privacy Policy",
        "nav_label": "Privacy",
        "description": "How SocialNova handles and protects your data.",
        "sections": [
            {
                "order": 0,
                "section_key": "article",
                "payload": _article(
                    "Privacy Policy\n==============\n\nEffective date: 2026\n\nThis Privacy Policy describes how SocialNova collects, uses, and protects your personal information.\n\nData collection\n---------------\n\n• Account information you provide at signup.\n• Content and analytics you generate while using the service.\n• Usage data for improving our products.\n\nData protection\n---------------\n\nWe use AES-256 encryption at rest and TLS 1.3 in transit. We never sell your personal data.\n\nContact\n-------\n\nprivacy@socialnova.ai"
                ),
            },
        ],
    },
    {
        "slug": "terms",
        "title": "Terms of Service",
        "nav_label": "Terms",
        "description": "The terms that govern your use of SocialNova.",
        "sections": [
            {
                "order": 0,
                "section_key": "article",
                "payload": _article(
                    "Terms of Service\n================\n\nEffective date: 2026\n\nBy using SocialNova you agree to these terms.\n\nYour account\n------------\n\n• You are responsible for information submitted under your account.\n• You must notify us of any unauthorized use.\n\nAcceptable use\n--------------\n\n• Don't use the service for unlawful activity.\n• Don't attempt to disrupt the service.\n\nLiability\n---------\n\nThe service is provided \"as is\". We are not liable for indirect damages arising from your use.\n\nContact\n-------\n\nlegal@socialnova.ai"
                ),
            },
        ],
    },
    {
        "slug": "demo",
        "title": "Watch a Demo",
        "nav_label": "Demo",
        "description": "See SocialNova in action.",
        "sections": [
            {
                "order": 0,
                "section_key": "hero",
                "payload": _hero(
                    "See SocialNova in action",
                    "A quick tour of how twelve AI agents plan, create, and publish your social media.",
                ),
            },
            {
                "order": 1,
                "section_key": "cta",
                "payload": _cta(
                    "Try it yourself",
                    "Create a free account and let Nova handle your first month of posts.",
                ),
            },
        ],
    },
]

NAV_ORDERED_SECTIONS = ["features", "pricing", "integrations", "blog", "about", "contact"]


async def seed_site_pages(db: AsyncSession) -> int:
    """Idempotently seed default CMS pages. Returns number created."""
    created = 0
    for spec in _PAGE_SPECS:
        existing = await db.execute(
            select(SitePage.id).where(SitePage.slug == spec["slug"])
        )
        if existing.scalar_one_or_none():
            continue

        page = SitePage(
            slug=spec["slug"],
            title=spec["title"],
            description=spec.get("description"),
            nav_label=spec.get("nav_label"),
            nav_order=spec.get("nav_order"),
            status="published",
            version=0,
        )
        db.add(page)
        await db.flush()

        for sec in spec.get("sections", []):
            db.add(
                SiteSection(
                    page_id=page.id,
                    section_key=sec["section_key"],
                    order=sec["order"],
                    is_enabled=True,
                    published_payload=sec.get("payload", {}),
                    draft_payload=sec.get("payload", {}),
                )
            )

        # Seed a v1 snapshot so history/rollback has a baseline.
        page.published_payload = {"title": spec["title"], "description": spec.get("description")}
        page.version = 1

        from models import ContentRevision

        db.add(
            ContentRevision(
                page_id=page.id,
                version=1,
                snapshot={
                    "page": {
                        "title": spec["title"],
                        "description": spec.get("description"),
                        "nav_label": spec.get("nav_label"),
                        "nav_order": spec.get("nav_order"),
                        "status": "published",
                        "payload": {
                            "title": spec["title"],
                            "description": spec.get("description"),
                        },
                    },
                    "sections": {
                        sec["section_key"]: {
                            "order": sec["order"],
                            "is_enabled": True,
                            "payload": sec.get("payload", {}),
                        }
                        for sec in spec.get("sections", [])
                    },
                },
                action="publish",
            )
        )
        created += 1

    if created:
        await db.commit()
    return created