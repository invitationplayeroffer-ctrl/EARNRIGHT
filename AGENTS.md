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
