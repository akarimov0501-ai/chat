param(
  [string]$RepoUrl = "https://github.com/akarimov0501-ai/chat.git",
  [string]$Branch = "main"
)

# --- Boshlanish ---
Write-Host "Ishga tushmoqda: push_to_github.ps1"
Write-Host "Iltimos, skriptni F:\Loyiham papkasida ishga tushiring."

# Tekshirish: joriy papka
$cwd = (Get-Location).Path
if ($cwd -ne "F:\Loyiham") {
  Write-Host "Xato: Joriy papka $cwd. Skriptni F:\Loyiham ichida ishga tushiring." -ForegroundColor Red
  exit 1
}

# Git mavjudligini tekshirish
try {
  git --version > $null 2>&1
} catch {
  Write-Host "Git o'rnatilmagan yoki PATH-ga kiritilmagan. Iltimos git o'rnating." -ForegroundColor Red
  exit 1
}

# Agar .git bo'lmasa, init qiling
if (-not (Test-Path ".git")) {
  Write-Host "Git repozitoriyasi topilmadi — git init qilinmoqda..."
  git init
} else {
  Write-Host "Git repozitoriyasi topildi."
}

# .gitignore yaratish (agar mavjud bo'lmasa)
if (-not (Test-Path ".gitignore")) {
  Write-Host ".gitignore yaratilmoqda..."
  @"
# Node / TypeScript
node_modules/
dist/
build/
coverage/
.env
.vscode/
*.log
# Optional
.DS_Store
npm-debug.log*
yarn-debug.log*
yarn-error.log*
"@ | Out-File -Encoding utf8 .gitignore
} else {
  Write-Host ".gitignore mavjud, o'zgartirilmayapti."
}

# Remote origin sozlash yoki yangilash
$remoteUrl = $null
try {
  $remoteUrl = git remote get-url origin 2>$null
} catch {}
if (-not $remoteUrl) {
  Write-Host "Remote origin yo'q — qo'shilmoqda: $RepoUrl"
  git remote add origin $RepoUrl
} elseif ($remoteUrl -ne $RepoUrl) {
  Write-Host "Remote origin boshqa URLga ishora qilmoqda ($remoteUrl). remote URL yangilanmoqda -> $RepoUrl"
  git remote set-url origin $RepoUrl
} else {
  Write-Host "Remote origin: $remoteUrl"
}

# Remote branch bor-yo'qligini tekshirish
$ls = git ls-remote --heads origin $Branch 2>$null
if ($ls) {
  Write-Host "Remote branch '$Branch' topildi. Lokal branchni yangilash va remote bilan rebase qilamiz..."
  git fetch origin $Branch
  git checkout -B $Branch
  try {
    git pull --rebase origin $Branch
  } catch {
    Write-Host "Pull/rebase jarayonida muammo. Iltimos konfliktlarni qo'lda hal qiling." -ForegroundColor Yellow
    exit 1
  }
} else {
  Write-Host "Remote branch '$Branch' topilmadi. Yangi lokal branch '$Branch' yaratilmoqda."
  git checkout -B $Branch
}

# Barcha o'zgartirishlarni qo'shish va commit qilish (agar o'zgartirishlar bo'lsa)
$status = git status --porcelain
if ($status) {
  Write-Host "O'zgartirishlar topildi. Commit qilinmoqda..."
  git add -A
  git commit -m "Loyiham: lokal yangilanishlar"
} else {
  Write-Host "O'zgartirishlar topilmadi — yangi commit yo'q."
}

# Push qilish
Write-Host "Remote-ga push qilinmoqda: origin/$Branch"
try {
  git push -u origin $Branch
  Write-Host "Push muvaffaqiyatli yakunlandi." -ForegroundColor Green
} catch {
  Write-Host "Push amalga oshmadi. Xatolikni ko'rish uchun quyidagi xabarni nusxa ko'chiring va menga yuboring:" -ForegroundColor Red
  git push -u origin $Branch 2>&1
  exit 1
}
# --- Tugadi ---