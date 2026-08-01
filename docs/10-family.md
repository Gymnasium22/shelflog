# Stage 10 — Family access

## Done

- Table `invitations` + RLS (admin/owner)
- Profile peer visibility within household
- RPCs:
  - `create_invitation`
  - `preview_invitation`
  - `accept_invitation`
  - `revoke_invitation`
  - `update_member_role` (incl. ownership transfer)
  - `remove_member` (kick / leave)
- UI `/app/family` — members, roles, invites
- Accept flow `/invite/{token}` (login-aware)
- Nav **Семья**

## Roles

| Role | Capabilities |
|------|----------------|
| owner | Full + transfer ownership |
| admin | Manage invites/members (not owner), full content |
| editor | CRUD domain content |
| viewer | Read-only (RLS) |

## How to test

1. Owner opens **Семья** → create invite link  
2. Open link in another browser / private window  
3. Sign up or log in → **Вступить в дом**  
4. See shared data (RLS by household)

## Note

MVP uses the **first** household membership as active home. Multi-home switcher can come later.
