<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep public welcome and account pages outside the managed authenticated layout; the dashboard lives at a named protected path to avoid duplicate home routes.
- Keep activity rewards in an owner-readable ledger controlled by database functions, not client-writable balances, to prevent reward tampering.
- Sample activities award demo credits only; real-money offers and withdrawals require provider verification before enabling payouts.
- Admin role is granted by the signup trigger to the owner email and checked via has_role; payouts/rewards change only through SECURITY DEFINER RPCs (why: prevents client tampering).
- Ban and password reset run in admin server functions using the service client after a has_role check (why: need auth admin API).
- Offer images live in a private bucket and are shown with signed URLs (why: public buckets are blocked).
- Enforce offer repeat eligibility in submit_offer under a per-user/offer transaction lock, and keep each repeat as a separate reviewed ledger entry (why: avoids duplicate one-time rewards and preserves repeat history).
- Use SocialLinks for grouped support and social links; show the group in the dashboard footer when the sidebar is hidden (why: keeps contact links together and available on mobile).
- Game/task offers are one-time with admin-set proof (question and/or screenshot in private proof-screenshots bucket, user-folder paths) via submit_proof; videos are unlimited and auto-credited by claim_video only after a server-timed start_video session (why: rewards cannot be self-granted from the client).

- Welcome art uses two bundled wallpaper layers with reduced-motion-aware crossfades, so it needs no external image host.
- Repeat Stack sessions, mystery box sessions and admin awards use reward_events with auth-checked RPCs, one pending session per kind per player, and idempotent admin request IDs to prevent duplicate credits.
- Timed rewards (video watch seconds, Stack 3s, box 5s visit and 10-minute box cooldown) are measured server-side from the start RPC's timestamp; the client only opens the offer link and re-triggers the claim RPC when the tab becomes visible again (why: rewards cannot be self-granted from the client).
- Profiles expose column-scoped updates only for personal details; bonus and ban state stay privileged to prevent balance tampering.
- Keep Lovable hosting defaults; select the Nitro Vercel preset only in an external hosting build command to preserve managed publishing.
