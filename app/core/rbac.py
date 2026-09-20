PERMISSIONS = (
    'resources.read','metrics.read','costs.read','recommendations.read','actions.read','policies.read','ai.use',
    'actions.request','actions.approve','budgets.write','audit.read','resources.manage','policies.write','accounts.manage','users.manage'
)
ROLE_PERMISSIONS = {
    'VIEWER': ['resources.read','metrics.read','costs.read','recommendations.read','actions.read','policies.read','ai.use'],
    'DEVOPS': ['resources.read','metrics.read','costs.read','recommendations.read','actions.read','policies.read','ai.use','actions.request'],
    'MANAGER': ['resources.read','metrics.read','costs.read','recommendations.read','actions.read','policies.read','ai.use','actions.request','actions.approve','budgets.write','audit.read','resources.manage'],
    'ADMIN': list(PERMISSIONS),
}
ROLE_ORDER = {'VIEWER': 0, 'DEVOPS': 1, 'MANAGER': 2, 'ADMIN': 3}

def permissions_for(role: str) -> list[str]:
    return list(ROLE_PERMISSIONS.get(role, []))

def role_at_least(role: str, minimum: str) -> bool:
    return ROLE_ORDER.get(role, -1) >= ROLE_ORDER.get(minimum, 99)

def roles_with_permission(permission: str) -> list[str]:
    return [r for r, ps in ROLE_PERMISSIONS.items() if permission in ps]
