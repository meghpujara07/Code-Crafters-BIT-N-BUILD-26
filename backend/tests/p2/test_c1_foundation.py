from app.core.rbac import permissions_for, role_at_least
from app.core.config import settings

def test_rbac_matrix():
    assert permissions_for('VIEWER') == ['resources.read','metrics.read','costs.read','recommendations.read','actions.read','policies.read','ai.use']
    assert 'actions.request' in permissions_for('DEVOPS')
    assert 'users.manage' not in permissions_for('MANAGER')
    assert role_at_least('ADMIN','MANAGER') and not role_at_least('VIEWER','MANAGER')

def test_settings_contract():
    assert settings.app_version == '2.0.0'
    assert settings.access_token_ttl_minutes == 15
    assert settings.refresh_token_ttl_days == 7
