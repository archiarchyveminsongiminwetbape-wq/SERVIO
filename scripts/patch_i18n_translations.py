from pathlib import Path
from typing import Dict

path = Path(r'c:\Users\hp\Music\project\src\i18n\translations.ts')
text = path.read_text(encoding='utf-8')

languages = ['fr', 'en', 'es', 'de', 'it', 'pt', 'ar', 'zh', 'ja', 'ko']

new_user_keys = {
    'language': {
        'fr': "language: 'Langue',",
        'en': "language: 'Language',",
        'es': "language: 'Idioma',",
        'de': "language: 'Sprache',",
        'it': "language: 'Lingua',",
        'pt': "language: 'Idioma',",
        'ar': "language: 'اللغة',",
        'zh': "language: '语言',",
        'ja': "language: '言語',",
        'ko': "language: '언어',",
    },
    'currency': {
        'fr': "currency: 'Devise',",
        'en': "currency: 'Currency',",
        'es': "currency: 'Moneda',",
        'de': "currency: 'Währung',",
        'it': "currency: 'Valuta',",
        'pt': "currency: 'Moeda',",
        'ar': "currency: 'العملة',",
        'zh': "currency: '货币',",
        'ja': "currency: '通貨',",
        'ko': "currency: '통화',",
    },
    'timezone': {
        'fr': "timezone: 'Fuseau horaire',",
        'en': "timezone: 'Timezone',",
        'es': "timezone: 'Zona horaria',",
        'de': "timezone: 'Zeitzone',",
        'it': "timezone: 'Fuso orario',",
        'pt': "timezone: 'Fuso horário',",
        'ar': "timezone: 'المنطقة الزمنية',",
        'zh': "timezone: '时区',",
        'ja': "timezone: 'タイムゾーン',",
        'ko': "timezone: '시간대',",
    },
    'accountInformation': {
        'fr': "accountInformation: 'Informations du compte',",
        'en': "accountInformation: 'Account Information',",
        'es': "accountInformation: 'Información de la cuenta',",
        'de': "accountInformation: 'Kontoinformationen',",
        'it': "accountInformation: 'Informazioni account',",
        'pt': "accountInformation: 'Informações da conta',",
        'ar': "accountInformation: 'معلومات الحساب',",
        'zh': "accountInformation: '账户信息',",
        'ja': "accountInformation: 'アカウント情報',",
        'ko': "accountInformation: '계정 정보',",
    },
    'deleteAccount': {
        'fr': "deleteAccount: 'Supprimer le compte',",
        'en': "deleteAccount: 'Delete account',",
        'es': "deleteAccount: 'Eliminar cuenta',",
        'de': "deleteAccount: 'Konto löschen',",
        'it': "deleteAccount: 'Elimina account',",
        'pt': "deleteAccount: 'Excluir conta',",
        'ar': "deleteAccount: 'حذف الحساب',",
        'zh': "deleteAccount: '删除账户',",
        'ja': "deleteAccount: 'アカウントを削除',",
        'ko': "deleteAccount: '계정 삭제',",
    },
    'deleteAccountWarning': {
        'fr': "deleteAccountWarning: 'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',",
        'en': "deleteAccountWarning: 'This action is irreversible. All your data will be permanently deleted.',",
        'es': "deleteAccountWarning: 'Esta acción es irreversible. Todos sus datos se eliminarán permanentemente.',",
        'de': "deleteAccountWarning: 'Diese Aktion ist unwiderruflich. Alle Ihre Daten werden dauerhaft gelöscht.',",
        'it': "deleteAccountWarning: 'Questa azione è irreversibile. Tutti i tuoi dati verranno eliminati definitivamente.',",
        'pt': "deleteAccountWarning: 'Esta ação é irreversível. Todos os seus dados serão excluídos permanentemente.',",
        'ar': "deleteAccountWarning: 'هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك نهائيًا.',",
        'zh': "deleteAccountWarning: '此操作不可撤销。您的所有数据将被永久删除。',",
        'ja': "deleteAccountWarning: 'この操作は元に戻せません。すべてのデータが永久に削除されます。',",
        'ko': "deleteAccountWarning: '이 작업은 되돌릴 수 없습니다. 모든 데이터가 영구적으로 삭제됩니다.',",
    },
    'deleteAccountConfirmPrompt': {
        'fr': "deleteAccountConfirmPrompt: 'Tapez \"SUPPRIMER\" pour confirmer',",
        'en': "deleteAccountConfirmPrompt: 'Type \"DELETE\" to confirm',",
        'es': "deleteAccountConfirmPrompt: 'Escriba \"ELIMINAR\" para confirmar',",
        'de': "deleteAccountConfirmPrompt: 'Geben Sie \"LÖSCHEN\" ein, um zu bestätigen',",
        'it': "deleteAccountConfirmPrompt: 'Digita \"ELIMINA\" per confermare',",
        'pt': "deleteAccountConfirmPrompt: 'Digite \"EXCLUIR\" para confirmar',",
        'ar': "deleteAccountConfirmPrompt: 'اكتب \"حذف\" للتأكيد',",
        'zh': "deleteAccountConfirmPrompt: '输入“删除”以确认',",
        'ja': "deleteAccountConfirmPrompt: '確認のため「削除」と入力してください',",
        'ko': "deleteAccountConfirmPrompt: '확인하려면 \"삭제\"를 입력하세요',",
    },
    'deleteAccountPlaceholder': {
        'fr': "deleteAccountPlaceholder: 'SUPPRIMER',",
        'en': "deleteAccountPlaceholder: 'DELETE',",
        'es': "deleteAccountPlaceholder: 'ELIMINAR',",
        'de': "deleteAccountPlaceholder: 'LÖSCHEN',",
        'it': "deleteAccountPlaceholder: 'ELIMINA',",
        'pt': "deleteAccountPlaceholder: 'EXCLUIR',",
        'ar': "deleteAccountPlaceholder: 'حذف',",
        'zh': "deleteAccountPlaceholder: '删除',",
        'ja': "deleteAccountPlaceholder: '削除',",
        'ko': "deleteAccountPlaceholder: '삭제',",
    },
    'deleteAccountPermanently': {
        'fr': "deleteAccountPermanently: 'Supprimer définitivement',",
        'en': "deleteAccountPermanently: 'Delete permanently',",
        'es': "deleteAccountPermanently: 'Eliminar permanentemente',",
        'de': "deleteAccountPermanently: 'Endgültig löschen',",
        'it': "deleteAccountPermanently: 'Elimina definitivamente',",
        'pt': "deleteAccountPermanently: 'Excluir permanentemente',",
        'ar': "deleteAccountPermanently: 'حذف نهائي',",
        'zh': "deleteAccountPermanently: '永久删除',",
        'ja': "deleteAccountPermanently: '完全に削除',",
        'ko': "deleteAccountPermanently: '영구 삭제',",
    },
    'profileVisibility': {
        'fr': "profileVisibility: 'Visibilité du profil',",
        'en': "profileVisibility: 'Profile visibility',",
        'es': "profileVisibility: 'Visibilidad del perfil',",
        'de': "profileVisibility: 'Profil sichtbar',",
        'it': "profileVisibility: 'Visibilità del profilo',",
        'pt': "profileVisibility: 'Visibilidade do perfil',",
        'ar': "profileVisibility: 'رؤية الملف الشخصي',",
        'zh': "profileVisibility: '资料可见性',",
        'ja': "profileVisibility: 'プロフィールの可視性',",
        'ko': "profileVisibility: '프로필 공개',",
    },
    'dataProtection': {
        'fr': "dataProtection: 'Protection des données',",
        'en': "dataProtection: 'Data protection',",
        'es': "dataProtection: 'Protección de datos',",
        'de': "dataProtection: 'Datenschutz',",
        'it': "dataProtection: 'Protezione dei dati',",
        'pt': "dataProtection: 'Proteção de dados',",
        'ar': "dataProtection: 'حماية البيانات',",
        'zh': "dataProtection: '数据保护',",
        'ja': "dataProtection: 'データ保護',",
        'ko': "dataProtection: '데이터 보호',",
    },
    'dataSharing': {
        'fr': "dataSharing: 'Partage de données',",
        'en': "dataSharing: 'Data sharing',",
        'es': "dataSharing: 'Compartir datos',",
        'de': "dataSharing: 'Datenfreigabe',",
        'it': "dataSharing: 'Condivisione dati',",
        'pt': "dataSharing: 'Compartilhamento de dados',",
        'ar': "dataSharing: 'مشاركة البيانات',",
        'zh': "dataSharing: '数据共享',",
        'ja': "dataSharing: 'データの共有',",
        'ko': "dataSharing: '데이터 공유',",
    },
    'downloadData': {
        'fr': "downloadData: 'Télécharger mes données',",
        'en': "downloadData: 'Download my data',",
        'es': "downloadData: 'Descargar mis datos',",
        'de': "downloadData: 'Meine Daten herunterladen',",
        'it': "downloadData: 'Scarica i miei dati',",
        'pt': "downloadData: 'Baixar meus dados',",
        'ar': "downloadData: 'تنزيل بياناتي',",
        'zh': "downloadData: '下载我的数据',",
        'ja': "downloadData: 'データをダウンロード',",
        'ko': "downloadData: '내 데이터 다운로드',",
    },
    'generalPreferences': {
        'fr': "generalPreferences: 'Préférences générales',",
        'en': "generalPreferences: 'General Preferences',",
        'es': "generalPreferences: 'Preferencias generales',",
        'de': "generalPreferences: 'Allgemeine Einstellungen',",
        'it': "generalPreferences: 'Preferenze generali',",
        'pt': "generalPreferences: 'Preferências gerais',",
        'ar': "generalPreferences: 'التفضيلات العامة',",
        'zh': "generalPreferences: '常规偏好',",
        'ja': "generalPreferences: '一般設定',",
        'ko': "generalPreferences: '일반 환경설정',",
    },
    'emailNotificationsDescription': {
        'fr': "emailNotificationsDescription: 'Recevoir des notifications par email',",
        'en': "emailNotificationsDescription: 'Receive email notifications',",
        'es': "emailNotificationsDescription: 'Recibir notificaciones por correo electrónico',",
        'de': "emailNotificationsDescription: 'E-Mail-Benachrichtigungen erhalten',",
        'it': "emailNotificationsDescription: 'Ricevi notifiche via email',",
        'pt': "emailNotificationsDescription: 'Receber notificações por email',",
        'ar': "emailNotificationsDescription: 'تلقي إشعارات البريد الإلكتروني',",
        'zh': "emailNotificationsDescription: '接收电子邮件通知',",
        'ja': "emailNotificationsDescription: 'メール通知を受け取る',",
        'ko': "emailNotificationsDescription: '이메일 알림 받기',",
    },
    'pushNotificationsDescription': {
        'fr': "pushNotificationsDescription: 'Recevoir des notifications push dans le navigateur',",
        'en': "pushNotificationsDescription: 'Receive push notifications in the browser',",
        'es': "pushNotificationsDescription: 'Recibir notificaciones push en el navegador',",
        'de': "pushNotificationsDescription: 'Push-Benachrichtigungen im Browser erhalten',",
        'it': "pushNotificationsDescription: 'Ricevi notifiche push nel browser',",
        'pt': "pushNotificationsDescription: 'Receber notificações push no navegador',",
        'ar': "pushNotificationsDescription: 'تلقي إشعارات الدفع في المتصفح',",
        'zh': "pushNotificationsDescription: '在浏览器中接收推送通知',",
        'ja': "pushNotificationsDescription: 'ブラウザでプッシュ通知を受け取る',",
        'ko': "pushNotificationsDescription: '브라우저에서 푸시 알림 받기',",
    },
    'messagesNotificationsDescription': {
        'fr': "messagesNotificationsDescription: 'Notifications pour les nouveaux messages',",
        'en': "messagesNotificationsDescription: 'Notifications for new messages',",
        'es': "messagesNotificationsDescription: 'Notificaciones para nuevos mensajes',",
        'de': "messagesNotificationsDescription: 'Benachrichtigungen für neue Nachrichten',",
        'it': "messagesNotificationsDescription: 'Notifiche per nuovi messaggi',",
        'pt': "messagesNotificationsDescription: 'Notificações para novas mensagens',",
        'ar': "messagesNotificationsDescription: 'إشعارات للرسائل الجديدة',",
        'zh': "messagesNotificationsDescription: '新消息通知',",
        'ja': "messagesNotificationsDescription: '新しいメッセージの通知',",
        'ko': "messagesNotificationsDescription: '새 메시지 알림',",
    },
    'reviewsNotificationsDescription': {
        'fr': "reviewsNotificationsDescription: 'Notifications pour les nouveaux avis',",
        'en': "reviewsNotificationsDescription: 'Notifications for new reviews',",
        'es': "reviewsNotificationsDescription: 'Notificaciones para nuevas reseñas',",
        'de': "reviewsNotificationsDescription: 'Benachrichtigungen für neue Bewertungen',",
        'it': "reviewsNotificationsDescription: 'Notifiche per nuove recensioni',",
        'pt': "reviewsNotificationsDescription: 'Notificações para novas avaliações',",
        'ar': "reviewsNotificationsDescription: 'إشعارات للتقييمات الجديدة',",
        'zh': "reviewsNotificationsDescription: '新的评论通知',",
        'ja': "reviewsNotificationsDescription: '新しいレビューの通知',",
        'ko': "reviewsNotificationsDescription: '새 리뷰 알림',",
    },
    'updatesNotificationsDescription': {
        'fr': "updatesNotificationsDescription: 'Nouvelles fonctionnalités et mises à jour',",
        'en': "updatesNotificationsDescription: 'Product updates and new features',",
        'es': "updatesNotificationsDescription: 'Actualizaciones de producto y nuevas funciones',",
        'de': "updatesNotificationsDescription: 'Produktupdates und neue Funktionen',",
        'it': "updatesNotificationsDescription: 'Aggiornamenti del prodotto e nuove funzionalità',",
        'pt': "updatesNotificationsDescription: 'Atualizações de produto e novos recursos',",
        'ar': "updatesNotificationsDescription: 'تحديثات المنتج والميزات الجديدة',",
        'zh': "updatesNotificationsDescription: '产品更新和新功能',",
        'ja': "updatesNotificationsDescription: '製品の更新と新機能',",
        'ko': "updatesNotificationsDescription: '제품 업데이트 및 새로운 기능',",
    },
    'settingsSubtitle': {
        'fr': "settingsSubtitle: 'Gérez vos paramètres de compte et préférences',",
        'en': "settingsSubtitle: 'Manage your account settings and preferences',",
        'es': "settingsSubtitle: 'Administre sus ajustes de cuenta y preferencias',",
        'de': "settingsSubtitle: 'Verwalten Sie Ihre Kontoeinstellungen und Präferenzen',",
        'it': "settingsSubtitle: 'Gestisci le impostazioni e le preferenze del tuo account',",
        'pt': "settingsSubtitle: 'Gerencie suas configurações de conta e preferências',",
        'ar': "settingsSubtitle: 'قم بإدارة إعدادات حسابك وتفضيلاتك',",
        'zh': "settingsSubtitle: '管理您的帐户设置和偏好',",
        'ja': "settingsSubtitle: 'アカウント設定と好みを管理します',",
        'ko': "settingsSubtitle: '계정 설정 및 환경설정을 관리하세요',",
    },
    'roleLabel': {
        'fr': "roleLabel: 'Rôle',",
        'en': "roleLabel: 'Role',",
        'es': "roleLabel: 'Rol',",
        'de': "roleLabel: 'Rolle',",
        'it': "roleLabel: 'Ruolo',",
        'pt': "roleLabel: 'Função',",
        'ar': "roleLabel: 'الدور',",
        'zh': "roleLabel: '角色',",
        'ja': "roleLabel: '役割',",
        'ko': "roleLabel: '역할',",
    },
}

# fix missing Spanish delete label if present
text = text.replace("delete: 'Eliminar)'", "delete: 'Eliminar'")

# insert missing common key for each language
for lang in languages:
    block_start = text.index(f"  {lang}: {{")
    next_start = min([text.index(f"  {other}: {{", block_start + 1) for other in languages if other != lang and text.find(f"  {other}: {{", block_start + 1) != -1] + [len(text)])
    block = text[block_start:next_start]

    # common block
    common_start = block.index('common: {') + block_start
    brace = 0
    i = text.index('{', common_start)
    while i < len(text):
        if text[i] == '{':
            brace += 1
        elif text[i] == '}':
            brace -= 1
            if brace == 0:
                common_end = i
                break
        i += 1
    common_text = text[common_start:common_end+1]
    if 'notAvailable:' not in common_text:
        insertion = '\n      ' + {
            'fr': "notAvailable: 'Non renseigné',",
            'en': "notAvailable: 'Not available',",
            'es': "notAvailable: 'No disponible',",
            'de': "notAvailable: 'Nicht verfügbar',",
            'it': "notAvailable: 'Non disponibile',",
            'pt': "notAvailable: 'Não disponível',",
            'ar': "notAvailable: 'غير متوفر',",
            'zh': "notAvailable: '不可用',",
            'ja': "notAvailable: '利用できません',",
            'ko': "notAvailable: '이용할 수 없음',",
        }[lang]
        text = text[:common_end] + insertion + text[common_end:]

    # user block
    user_start = block.index('user: {') + block_start
    brace = 0
    i = text.index('{', user_start)
    while i < len(text):
        if text[i] == '{':
            brace += 1
        elif text[i] == '}':
            brace -= 1
            if brace == 0:
                user_end = i
                break
        i += 1
    user_text = text[user_start:user_end+1]
    if 'terms:' not in user_text:
        raise SystemExit(f'terms line missing for {lang}')
    terms_index = user_text.index('terms:') + user_start
    term_line_end = text.index('\n', terms_index)
    insert_pos = term_line_end + 1
    for key, values in new_user_keys.items():
        if f"{key}:" not in user_text:
            insertion = '      ' + values[lang] + '\n'
            text = text[:insert_pos] + insertion + text[insert_pos:]
            insert_pos += len(insertion)
            user_text = text[user_start:user_end+1]

# insert missing type definitions
interface_start = text.index('  user: {')
interface_end = text.index('  admin: {', interface_start)
interface_text = text[interface_start:interface_end]
for key in new_user_keys:
    if f"{key}: string;" not in interface_text:
        insert_after = '    terms: string;\n'
        interface_insert_pos = text.index(insert_after, interface_start, interface_end) + len(insert_after)
        text = text[:interface_insert_pos] + '    ' + key + ': string;\n' + text[interface_insert_pos:]
        interface_end += len('    ' + key + ': string;\n')

path.write_text(text, encoding='utf-8')
print('Translations.ts patched successfully')
