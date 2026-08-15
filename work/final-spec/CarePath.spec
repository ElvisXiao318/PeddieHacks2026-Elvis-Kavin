# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['../../server.py'],
    pathex=[],
    binaries=[],
    datas=[('C:/Users/elvis/Documents/Codex/2026-08-15/thi/PeddieHacks2026-Elvis-Kavin/schema.sql', '.'), ('C:/Users/elvis/Documents/Codex/2026-08-15/thi/PeddieHacks2026-Elvis-Kavin/index.html', '.'), ('C:/Users/elvis/Documents/Codex/2026-08-15/thi/PeddieHacks2026-Elvis-Kavin/admin.html', '.'), ('C:/Users/elvis/Documents/Codex/2026-08-15/thi/PeddieHacks2026-Elvis-Kavin/patient.html', '.'), ('C:/Users/elvis/Documents/Codex/2026-08-15/thi/PeddieHacks2026-Elvis-Kavin/provider.html', '.'), ('C:/Users/elvis/Documents/Codex/2026-08-15/thi/PeddieHacks2026-Elvis-Kavin/css', 'css'), ('C:/Users/elvis/Documents/Codex/2026-08-15/thi/PeddieHacks2026-Elvis-Kavin/js', 'js')],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='CarePath',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
