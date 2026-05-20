// ==================== 国际化 (i18n) ====================

var i18n = {
  _lang: 'en', // default language
  _strings: {
    zh: {
      // Toolbar
      'toolbar.title': 'XiaoSheng 的计划本',
      'btn.addSet': '+ 计划集',
      'btn.itemTag': '+ 项目标签',
      'btn.import': '导入',
      'btn.export': '导出 ▾',
      'btn.exportJSON': '导出 JSON',
      'btn.exportZIP': '导出 ZIP',

      // Bottom bar
      'btn.prevDate': '‹ 上一天',
      'btn.nextDate': '下一天 ›',
      'btn.copyDay': '复制到明天',
      'btn.changeDate': '更换日期',
      'btn.clearPage': '清空',

      // Empty state
      'empty.title': '~ 开始规划 ~',
      'empty.desc': '点击 "+ 计划集" 开始，或点击 "导入" 加载计划',

      // Confirm
      'confirm.yes': '确认',
      'confirm.no': '取消',

      // Tag modal
      'tagModal.title': '~ 标签管理 ~',
      'tagModal.addPlaceholder': '新标签名称...',
      'tagModal.add': '添加',
      'tagModal.done': '完成',
      'tagModal.empty': '还没有标签，在下方添加一个！',
      'tagModal.tagNameRequired': '请输入标签名称',

      // Finished set
      'finished.title': '已完成',
      'finished.undo': '撤销完成',
      'finished.undoDone': '已撤销完成！',

      // Plan items
      'plan.newPlan': '新计划',
      'plan.newItem': '新项目',
      'plan.untitled': '未命名',

      // CRUD messages
      'msg.imported': '导入成功！',
      'msg.invalidJSON': '无效的 JSON 文件！',
      'msg.jsonExported': 'JSON 导出成功！',
      'msg.zipExported': 'ZIP 导出成功！',
      'msg.generatingZip': '正在生成 ZIP...',
      'msg.noPlanSetsToCopy': '没有可复制的计划集',
      'msg.copiedTo': '已复制到 ',
      'msg.selectDifferentDate': '请选择不同的日期',
      'msg.noDataToMove': '当前日期没有可移动的数据',
      'msg.dataMovedTo': '数据已移动到 ',
      'msg.pageAlreadyEmpty': '页面已经是空的',
      'msg.clearConfirm': '清空当前页面的所有计划集（包括已完成）？',
      'msg.pageCleared': '页面已清空',
      'msg.markedAsDone': '已标记为完成！',
      'msg.deletedPlanSet': '删除计划集 "{title}"？',

      // Save
      'btn.saveLocal': '保存本地',
      'btn.saveRemote': '保存远程',
      'btn.remote': '远程',
      'btn.local': '本地',
      'msg.noDataToSave': '没有可保存的数据',
      'msg.noLocalPath': '未配置本地路径，请点击设置',
      'msg.savedLocally': '已保存到本地！',
      'msg.permissionDenied': '权限被拒绝，请重试',
      'msg.saveFailed': '保存失败：',
      'msg.savedLocalAndRemote': '已保存到本地并推送到 GitHub！',
      'msg.savedLocalPushFailed': '已保存到本地，但推送失败：',
      'msg.pushFailed': '推送失败：',
      'msg.pushedToGithub': '已推送到 GitHub！',
      'msg.noGithubConfig': '未找到 GitHub 配置，请点击设置进行配置',
      'msg.noLocalPathShort': '未配置本地路径',
      'msg.switchedToLocal': '已切换到本地数据',
      'msg.noLocalData': '未找到本地数据',
      'msg.switchedToRemote': '已切换到 GitHub 数据',
      'msg.noRemoteData': '还没有远程数据，使用 "保存远程" 推送本地数据',

      // Change Date modal
      'changeDate.title': '~ 更换日期 ~',
      'changeDate.desc': '将当前日期的数据移动到新日期',
      'changeDate.move': '移动',
      'changeDate.cancel': '取消',

      // Settings
      'settings.title': '~ 设置 ~',
      'settings.back': '返回',
      'settings.logout': '登出',
      'settings.username': '用户名',
      'settings.githubOwner': 'GitHub 用户名 / 组织',
      'settings.repo': '仓库名称',
      'settings.filePath': '文件路径（仓库中）',
      'settings.filePathHint': '计划数据将存储在仓库的此路径',
      'settings.branch': '分支',
      'settings.token': '个人访问令牌',
      'settings.tokenHint': '具有 repo 权限的 GitHub Token · <a href="https://github.com/settings/tokens" target="_blank" style="color:var(--color-tag-normal);">生成令牌</a>',
      'settings.localPath': '本地工作路径',
      'settings.localPathPlaceholder': '点击 "选择" 来选择...',
      'settings.noPathSelected': '未选择路径',
      'settings.select': '选择',
      'settings.testConnection': '测试连接',
      'settings.saveConfig': '保存配置',
      'settings.register': '注册',
      'settings.clear': '清除',
      'settings.clearConfirm': '清除所有设置？这将删除配置和工作路径',
      'settings.cleared': '设置已清除',
      'settings.localOfflineMode': '本地离线模式',
      'settings.configSaved': '配置已保存！',
      'settings.autoLoginFailed': '注册成功，但自动登录失败：',
      'settings.registrationFailed': '注册失败：',
      'settings.connectedSetPassword': '已连接！请设置密码...',
      'settings.savingConfig': '正在保存配置...',
      'settings.ownerRegistered': '主人注册成功！',
      'settings.registeredAs': '已注册为 "',
      'settings.configSavedEnterOwnerPassword': '配置已保存！请输入主人密码...',
      'settings.authorizing': '正在授权...',
      'settings.registrationCancelled': '注册已取消（配置已保存到本地）',
      'settings.path': '路径：',
      'msg.pleaseFillOwnerRepoToken': '请填写所有者、仓库和令牌',
      'msg.pleaseSelectLocalPath': '请选择本地工作路径',
      'msg.connecting': '连接中...',
      'msg.connectionSuccess': '连接成功！',
      'msg.connectionFailed': '连接失败：',

      // Password modal
      'password.title': '~ 输入密码 ~',
      'password.message': '输入密码',
      'password.usernamePlaceholder': '用户名（留空为主人）',
      'password.placeholder': '密码...',
      'password.confirmPlaceholder': '确认密码...',
      'password.ok': '确认',
      'password.skip': '跳过',
      'password.save': '保存',
      'password.cancel': '取消',
      'password.passwordEmpty': '密码不能为空',
      'password.passwordMismatch': '两次密码不一致',
      'password.setTitle': '~ 设置密码 ~',
      'password.ownerVerification': '~ 主人验证 ~',
      'password.ownerVerificationMessage': '输入项目主人密码以授权注册',
      'password.setOwnerPasswordMessage': '设置您的密码。\n您需要此密码才能登录。',
      'password.setAccountPasswordMessage': '设置您的密码。\n您需要此密码才能登录。',

      // Login
      'login.title': '登录',
      'login.webMessage': '输入用户名和密码以加载数据',
      'login.localMessage': '输入用户名和密码（留空跳过）',
      'login.cancelWeb': '取消',
      'login.cancelLocal': '跳过（离线）',
      'login.failed': '登录失败',
      'msg.loading': '加载中...',

      // Auth messages
      'msg.loadedFromGithub': '从 GitHub 加载！',
      'msg.welcome': '欢迎，',
      'msg.noRemoteDataLoadedLocal': '没有远程数据，已加载本地数据',
      'msg.startFresh': '没有现有的计划数据，开始新的规划！',
      'msg.githubFailedLoadedLocal': 'GitHub 失败，已加载本地数据',
      'msg.failedToLoad': '加载计划数据失败：',

      // Work Path
      'workPath.title': '~ 本地工作路径 ~',
      'workPath.authorizeMessage': '找到已有工作路径："{dirName}"。是否授权访问以支持离线存储？',
      'workPath.selectMessage': '需要本地工作路径来存储计划数据以供离线访问。\n点击 "选择" 选择一个目录。',
      'workPath.skip': '跳过',
      'workPath.select': '选择',
      'workPath.authorize': '授权',
      'workPath.browserNotSupported': '浏览器不支持目录选择（请使用 Chrome）',
      'msg.noLocalWorkPath': '没有本地工作路径，请使用设置配置',
      'msg.noLocalConfig': '未找到本地配置',
      'msg.wrongPassword': '密码错误！',
      'msg.workPathSet': '工作路径已设置',
      'msg.failedToPick': '选择目录失败：',

      // Access prompt
      'access.grant': '授权工作区访问权限以加载数据',
      'access.btn': '授权工作区',
      'access.requesting': '请求中...',

      // Confirm messages
      'confirm.unsavedChanges': '您有未保存的更改！确定要离开吗？',
      'confirm.logout': '登出？未保存的更改将丢失',

      // Auth error messages
      'auth.noOwnerConfig': '未找到主人配置',
      'auth.userNotFound': '用户 "{username}" 不存在',
      'auth.configCorrupted': '配置文件已损坏',
      'auth.usernameTaken': '用户名 "{username}" 已被占用',

      // Misc
      'msg.selectWorkDir': '选择工作目录：{dirName}\n\n确定打开选择器，取消跳过',
      'unlock.title': '解锁 GitHub 同步',

      // Language toggle
      'lang.toggle': '中文'
    },
    en: {
      // Toolbar
      'toolbar.title': "The gift for XiaoSheng by berlinlancho",
      'btn.addSet': '+ Plan Set',
      'btn.itemTag': '+ Item Tag',
      'btn.import': 'Import',
      'btn.export': 'Export v',
      'btn.exportJSON': 'Export JSON',
      'btn.exportZIP': 'Export ZIP',

      // Bottom bar
      'btn.prevDate': '< Prev',
      'btn.nextDate': 'Next >',
      'btn.copyDay': 'Copy to Next Day',
      'btn.changeDate': 'Change Date',
      'btn.clearPage': 'Clear',

      // Empty state
      'empty.title': '~ sketch your plan ~',
      'empty.desc': 'Click "+ Plan Set" to start, or "Import" to load a plan',

      // Confirm
      'confirm.yes': 'Yes',
      'confirm.no': 'No',

      // Tag modal
      'tagModal.title': '~ Tag Manager ~',
      'tagModal.addPlaceholder': 'new tag name...',
      'tagModal.add': 'Add',
      'tagModal.done': 'Done',
      'tagModal.empty': 'No tags yet. Add one below!',
      'tagModal.tagNameRequired': 'Please enter a tag name',

      // Finished set
      'finished.title': 'Finished',
      'finished.undo': 'Undo',
      'finished.undoDone': 'Undone!',

      // Plan items
      'plan.newPlan': 'New Plan',
      'plan.newItem': 'New Item',
      'plan.untitled': 'Untitled',

      // CRUD messages
      'msg.imported': 'Imported successfully!',
      'msg.invalidJSON': 'Invalid JSON file!',
      'msg.jsonExported': 'JSON exported!',
      'msg.zipExported': 'ZIP exported!',
      'msg.generatingZip': 'Generating ZIP...',
      'msg.noPlanSetsToCopy': 'No plan sets to copy',
      'msg.copiedTo': 'Copied to ',
      'msg.selectDifferentDate': 'Please select a different date',
      'msg.noDataToMove': 'No data to move on current date',
      'msg.dataMovedTo': 'Data moved to ',
      'msg.pageAlreadyEmpty': 'Page is already empty',
      'msg.clearConfirm': 'Clear all plan sets on this page (including Finished)?',
      'msg.pageCleared': 'Page cleared',
      'msg.markedAsDone': 'Marked as done!',
      'msg.deletedPlanSet': 'Delete plan set "{title}"?',

      // Save
      'btn.saveLocal': 'Save Local',
      'btn.saveRemote': 'Save Remote',
      'btn.remote': 'Remote',
      'btn.local': 'Local',
      'msg.noDataToSave': 'No data to save',
      'msg.noLocalPath': 'No local work path configured. Click Settings.',
      'msg.savedLocally': 'Saved locally!',
      'msg.permissionDenied': 'Permission denied. Try again.',
      'msg.saveFailed': 'Save failed: ',
      'msg.savedLocalAndRemote': 'Saved locally & pushed to GitHub!',
      'msg.savedLocalPushFailed': 'Saved locally, but push failed: ',
      'msg.pushFailed': 'Push failed: ',
      'msg.pushedToGithub': 'Pushed to GitHub!',
      'msg.noGithubConfig': 'No GitHub config found. Click Settings to configure.',
      'msg.noLocalPathShort': 'No local work path configured',
      'msg.switchedToLocal': 'Switched to local data',
      'msg.noLocalData': 'No local data found',
      'msg.switchedToRemote': 'Switched to GitHub data',
      'msg.noRemoteData': 'No remote data yet. Use "Save Remote" to push local data.',

      // Change Date modal
      'changeDate.title': '~ Change Date ~',
      'changeDate.desc': 'Move current date data to a new date',
      'changeDate.move': 'Move',
      'changeDate.cancel': 'Cancel',

      // Settings
      'settings.title': '~ Settings ~',
      'settings.back': 'Back',
      'settings.logout': 'Logout',
      'settings.username': 'Username',
      'settings.githubOwner': 'GitHub Username / Organization',
      'settings.repo': 'Repository Name',
      'settings.filePath': 'File Path (in repo)',
      'settings.filePathHint': 'Plan data will be stored at this path in the repository',
      'settings.branch': 'Branch',
      'settings.token': 'Personal Access Token',
      'settings.tokenHint': 'GitHub Token with repo scope · <a href="https://github.com/settings/tokens" target="_blank" style="color:var(--color-tag-normal);">Generate Token</a>',
      'settings.localPath': 'Local Work Path',
      'settings.localPathPlaceholder': 'Click "Select" to choose...',
      'settings.noPathSelected': 'No path selected',
      'settings.select': 'Select',
      'settings.testConnection': 'Test Connection',
      'settings.saveConfig': 'Save Config',
      'settings.register': 'Register',
      'settings.clear': 'Clear',
      'settings.clearConfirm': 'Clear all settings? This will remove config and work path',
      'settings.cleared': 'Settings cleared',
      'settings.localOfflineMode': 'Local offline mode',
      'settings.configSaved': 'Config saved!',
      'settings.autoLoginFailed': 'Registered, but auto-login failed: ',
      'settings.registrationFailed': 'Registration failed: ',
      'settings.connectedSetPassword': 'Connected! Set your password...',
      'settings.savingConfig': 'Saving config...',
      'settings.ownerRegistered': 'Owner registered!',
      'settings.registeredAs': 'Registered as "',
      'settings.configSavedEnterOwnerPassword': 'Config saved! Enter owner password...',
      'settings.authorizing': 'Authorizing...',
      'settings.registrationCancelled': 'Registration cancelled (config saved locally)',
      'settings.path': 'Path: ',
      'msg.pleaseFillOwnerRepoToken': 'Please fill in Owner, Repo and Token',
      'msg.pleaseSelectLocalPath': 'Please select a local work path',
      'msg.connecting': 'Connecting...',
      'msg.connectionSuccess': 'Connection successful!',
      'msg.connectionFailed': 'Connection failed: ',

      // Password modal
      'password.title': '~ Enter Password ~',
      'password.message': 'Enter password',
      'password.usernamePlaceholder': 'Username (leave empty for owner)',
      'password.placeholder': 'Password...',
      'password.confirmPlaceholder': 'Confirm password...',
      'password.ok': 'OK',
      'password.skip': 'Skip',
      'password.save': 'Save',
      'password.cancel': 'Cancel',
      'password.passwordEmpty': 'Password cannot be empty',
      'password.passwordMismatch': 'Passwords do not match',
      'password.setTitle': '~ Set Password ~',
      'password.ownerVerification': '~ Owner Verification ~',
      'password.ownerVerificationMessage': 'Enter the project owner password to authorize registration',
      'password.setOwnerPasswordMessage': 'Set your password.\nYou need it to login later.',
      'password.setAccountPasswordMessage': 'Set your account password.\nYou need it to login later.',

      // Login
      'login.title': 'Login',
      'login.webMessage': 'Enter username and password to load your data',
      'login.localMessage': 'Enter username and password (leave empty to skip)',
      'login.cancelWeb': 'Cancel',
      'login.cancelLocal': 'Skip (Offline)',
      'login.failed': 'Login failed',
      'msg.loading': 'Loading...',

      // Auth messages
      'msg.loadedFromGithub': 'Loaded from GitHub!',
      'msg.welcome': 'Welcome, ',
      'msg.noRemoteDataLoadedLocal': 'No remote data. Loaded local data.',
      'msg.startFresh': 'No existing plan data. Start fresh!',
      'msg.githubFailedLoadedLocal': 'GitHub failed. Loaded local data.',
      'msg.failedToLoad': 'Failed to load plan data: ',

      // Work Path
      'workPath.title': '~ Local Work Path ~',
      'workPath.authorizeMessage': 'Found existing work path: "{dirName}". Authorize access for offline storage?',
      'workPath.selectMessage': 'A local work path is needed to store your plan data locally for offline access.\nClick "Select" to choose a directory.',
      'workPath.skip': 'Skip',
      'workPath.select': 'Select',
      'workPath.authorize': 'Authorize',
      'workPath.browserNotSupported': 'Browser does not support directory picking (use Chrome)',
      'msg.noLocalWorkPath': 'No local work path. Use Settings to configure.',
      'msg.noLocalConfig': 'No local config found.',
      'msg.wrongPassword': 'Wrong password!',
      'msg.workPathSet': 'Work path set: ',
      'msg.failedToPick': 'Failed to pick directory: ',

      // Access prompt
      'access.grant': 'Grant access to your local workspace to load data',
      'access.btn': 'Grant Workspace Access',
      'access.requesting': 'Requesting...',

      // Confirm messages
      'confirm.unsavedChanges': 'You have unsaved changes! Are you sure you want to leave?',
      'confirm.logout': 'Logout? Unsaved changes will be lost',

      // Auth error messages
      'auth.noOwnerConfig': 'No owner config found',
      'auth.userNotFound': 'User "{username}" not found',
      'auth.configCorrupted': 'Config file is corrupted',
      'auth.usernameTaken': 'Username "{username}" is already taken',

      // Misc
      'msg.selectWorkDir': 'Select work directory: {dirName}\n\nOK to open picker, Cancel to skip.',
      'unlock.title': 'Unlock GitHub Sync',

      // Language toggle
      'lang.toggle': '中文'
    }
  },

  init: function() {
    var saved = localStorage.getItem('plan_lang');
    if (saved && (saved === 'zh' || saved === 'en')) {
      this._lang = saved;
    }
    this.apply();
  },

  getLang: function() {
    return this._lang;
  },

  toggle: function() {
    this._lang = this._lang === 'en' ? 'zh' : 'en';
    localStorage.setItem('plan_lang', this._lang);
    try { render(); } catch(e) { console.error('[i18n toggle render error]', e); }
  },

  t: function(key, replacements) {
    var str = (this._strings[this._lang] && this._strings[this._lang][key])
      || (this._strings['en'] && this._strings['en'][key])
      || key;
    if (replacements) {
      for (var k in replacements) {
        str = str.replace('{' + k + '}', replacements[k]);
      }
    }
    return str;
  },

  apply: function() {
    try {
    // Toolbar
    var titleEl = document.querySelector('#toolbar .title');
    if (titleEl) titleEl.textContent = this.t('toolbar.title');

    var addSetBtn = document.getElementById('btn-add-set');
    if (addSetBtn) addSetBtn.textContent = this.t('btn.addSet');

    var tagBtn = document.getElementById('btn-open-tag');
    if (tagBtn) tagBtn.textContent = this.t('btn.itemTag');

    var importBtn = document.getElementById('btn-import');
    if (importBtn) importBtn.textContent = this.t('btn.import');

    var exportBtn = document.getElementById('btn-export');
    if (exportBtn) exportBtn.textContent = this.t('btn.export');

    var exportMenuBtns = document.querySelectorAll('#export-menu .sketch-btn');
    if (exportMenuBtns.length >= 2) {
      exportMenuBtns[0].textContent = this.t('btn.exportJSON');
      exportMenuBtns[1].textContent = this.t('btn.exportZIP');
    }

    var saveLocalBtn = document.getElementById('btn-save-local');
    if (saveLocalBtn) saveLocalBtn.textContent = this.t('btn.saveLocal');

    var saveRemoteBtn = document.getElementById('btn-save-remote');
    if (saveRemoteBtn) saveRemoteBtn.textContent = this.t('btn.saveRemote');

    var langBtn = document.getElementById('btn-lang-toggle');
    if (langBtn) langBtn.textContent = this._lang === 'en' ? '中文' : 'EN';

    // Bottom bar
    var prevBtn = document.querySelector('[data-action="prev-date"]');
    if (prevBtn) prevBtn.textContent = this.t('btn.prevDate');

    var nextBtn = document.querySelector('[data-action="next-date"]');
    if (nextBtn) nextBtn.textContent = this.t('btn.nextDate');

    var copyBtn = document.querySelector('[data-action="copy-day"]');
    if (copyBtn) copyBtn.textContent = this.t('btn.copyDay');

    var changeDateBtn = document.querySelector('[data-action="change-date"]');
    if (changeDateBtn) changeDateBtn.textContent = this.t('btn.changeDate');

    var clearBtn = document.querySelector('[data-action="clear-page"]');
    if (clearBtn) clearBtn.textContent = this.t('btn.clearPage');

    // Empty state
    var emptyBig = document.querySelector('#empty-state .big');
    if (emptyBig) emptyBig.textContent = this.t('empty.title');
    var emptyDesc = document.querySelector('#empty-state > div:not(.big)');
    if (emptyDesc) emptyDesc.textContent = this.t('empty.desc');

    // Access prompt
    var accessP = document.querySelector('#access-prompt p');
    if (accessP) accessP.textContent = this.t('access.grant');
    var accessBtn = document.getElementById('btn-grant-access');
    if (accessBtn) accessBtn.textContent = this.t('access.btn');

    // Change date modal
    var cdTitle = document.querySelector('#changedate-box h3');
    if (cdTitle) cdTitle.textContent = this.t('changeDate.title');
    var cdDesc = document.querySelector('#changedate-box p');
    if (cdDesc) cdDesc.textContent = this.t('changeDate.desc');
    var cdMove = document.getElementById('changedate-move');
    if (cdMove) cdMove.textContent = this.t('changeDate.move');
    var cdCancel = document.getElementById('changedate-cancel');
    if (cdCancel) cdCancel.textContent = this.t('changeDate.cancel');

    // Tag modal
    var tmTitle = document.querySelector('#tag-modal h3');
    if (tmTitle) tmTitle.textContent = this.t('tagModal.title');
    var tmPlaceholder = document.getElementById('new-tag-name');
    if (tmPlaceholder) tmPlaceholder.placeholder = this.t('tagModal.addPlaceholder');
    var tmAdd = document.getElementById('btn-add-tag');
    if (tmAdd) tmAdd.textContent = this.t('tagModal.add');
    var tmDone = document.getElementById('btn-tag-done');
    if (tmDone) tmDone.textContent = this.t('tagModal.done');

    // Confirm buttons
    var confirmYes = document.getElementById('confirm-yes');
    if (confirmYes) confirmYes.textContent = this.t('confirm.yes');
    var confirmNo = document.getElementById('confirm-no');
    if (confirmNo) confirmNo.textContent = this.t('confirm.no');

    // Settings
    var sTitle = document.querySelector('#settings-page h2');
    if (sTitle) sTitle.textContent = this.t('settings.title');
    var sBack = document.getElementById('btn-settings-close');
    if (sBack) sBack.textContent = this.t('settings.back');
    var sLogout = document.getElementById('btn-logout');
    if (sLogout) sLogout.textContent = this.t('settings.logout');
    var sTest = document.getElementById('btn-settings-test');
    if (sTest) sTest.textContent = this.t('settings.testConnection');
    var sClear = document.getElementById('btn-settings-clear');
    if (sClear) sClear.textContent = this.t('settings.clear');
    var sPickDir = document.getElementById('btn-settings-pickdir');
    if (sPickDir) sPickDir.textContent = this.t('settings.select');

    // Settings labels
    var sUsernameLabel = document.querySelector('#settings-username-group label');
    if (sUsernameLabel) sUsernameLabel.textContent = this.t('settings.username');
    var sUsernameInput = document.getElementById('cfg-username');
    if (sUsernameInput) sUsernameInput.placeholder = 'Your account username';
    var sOwnerLabel = document.querySelector('#settings-group:nth-child(3) label') || document.querySelectorAll('.settings-group label')[0];
    var sRepoLabel = document.querySelectorAll('.settings-group label')[1];
    var sPathLabel = document.getElementById('settings-path-group');
    if (sPathLabel) {
      var pathLabel = sPathLabel.querySelector('label');
      if (pathLabel) pathLabel.textContent = this.t('settings.filePath');
      var pathHint = sPathLabel.querySelector('.hint');
      if (pathHint) pathHint.innerHTML = this.t('settings.filePathHint');
    }
    var sBranchLabel = document.querySelectorAll('.settings-group label')[3];
    var sTokenLabel = document.querySelectorAll('.settings-group label')[4];
    var sLocalPathLabel = document.querySelectorAll('.settings-group label')[5];
    if (sLocalPathLabel) sLocalPathLabel.textContent = this.t('settings.localPath');

    // Loop through all settings-group labels for easier localization
    var settingsLabels = document.querySelectorAll('#settings-page .settings-group label');
    var labelKeys = [
      'settings.username',
      'settings.githubOwner',
      'settings.repo',
      'settings.filePath',
      'settings.branch',
      'settings.token',
      'settings.localPath'
    ];
    for (var i = 0; i < settingsLabels.length && i < labelKeys.length; i++) {
      settingsLabels[i].textContent = this.t(labelKeys[i]);
    }

    // Settings placeholders
    var cfgOwner = document.getElementById('cfg-owner');
    if (cfgOwner) cfgOwner.placeholder = 'e.g. octocat';
    var cfgRepo = document.getElementById('cfg-repo');
    if (cfgRepo) cfgRepo.placeholder = 'e.g. my-plan-data';
    var cfgBranch = document.getElementById('cfg-branch');
    if (cfgBranch) cfgBranch.placeholder = 'main';
    var cfgToken = document.getElementById('cfg-token');
    if (cfgToken) cfgToken.placeholder = 'ghp_xxxxxxxxxxxx';
    var cfgWorkpath = document.getElementById('cfg-workpath');
    if (cfgWorkpath) cfgWorkpath.placeholder = this.t('settings.localPathPlaceholder');

    // Settings hints
    var tokenHint = document.getElementById('cfg-token');
    if (tokenHint) {
      var hintEl = tokenHint.parentElement.querySelector('.hint');
      if (hintEl) hintEl.innerHTML = this.t('settings.tokenHint');
    }
    var workpathStatus = document.getElementById('workpath-status');
    // Don't override dynamic status text

    // Password modal defaults
    var passwordOk = document.getElementById('password-ok');
    if (passwordOk) passwordOk.textContent = this.t('password.ok');
    var passwordCancel = document.getElementById('password-cancel');
    if (passwordCancel) passwordCancel.textContent = this.t('password.skip');
    var passwordUsername = document.getElementById('password-username');
    if (passwordUsername) passwordUsername.placeholder = this.t('password.usernamePlaceholder');
    var passwordInput = document.getElementById('password-input');
    if (passwordInput) passwordInput.placeholder = this.t('password.placeholder');
    var passwordConfirm = document.getElementById('password-confirm');
    if (passwordConfirm) passwordConfirm.placeholder = this.t('password.confirmPlaceholder');

    // Work path modal
    var wpTitle = document.querySelector('#workpath-box h3');
    if (wpTitle) wpTitle.textContent = this.t('workPath.title');
    var wpSkip = document.getElementById('workpath-cancel');
    if (wpSkip) wpSkip.textContent = this.t('workPath.skip');
    var wpSelect = document.getElementById('workpath-select');
    if (wpSelect) wpSelect.textContent = this.t('workPath.select');
    var wpAuth = document.getElementById('workpath-authorize');
    if (wpAuth) wpAuth.textContent = this.t('workPath.authorize');

    // Toggle source UI
    updateToggleUI();
    } catch(e) { console.error('[i18n apply error]', e); }
  }
};
