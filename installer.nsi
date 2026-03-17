
!define APP_NAME "MixFade"
!define APP_VERSION "0.9.7"
!define APP_PUBLISHER "MixFade Team"
!define APP_URL "https://mixfade.app"
!define APP_EXECUTABLE "mixfade.exe"

; Installer settings
Name "${APP_NAME} ${APP_VERSION}"
OutFile "C:\Users\roxas\OneDrive\Desktop\PROJECTS\MixFade\Prototype4\release\MixFade Setup 0.9.7.exe"
InstallDir "$PROGRAMFILES64\${APP_NAME}"
InstallDirRegKey HKLM "Software\${APP_NAME}" "InstallDir"
RequestExecutionLevel admin

; Modern UI
!include "MUI2.nsh"
!define MUI_ABORTWARNING
!define MUI_ICON "C:\Users\roxas\OneDrive\Desktop\PROJECTS\MixFade\Prototype4\public\mixfade_icon-icoext.ico"
!define MUI_UNICON "C:\Users\roxas\OneDrive\Desktop\PROJECTS\MixFade\Prototype4\public\mixfade_icon-icoext.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "C:\Users\roxas\OneDrive\Desktop\PROJECTS\MixFade\Prototype4\LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

; Version info
VIProductVersion "0.9.7.0"
VIAddVersionKey "ProductName" "${APP_NAME}"
VIAddVersionKey "ProductVersion" "${APP_VERSION}"
VIAddVersionKey "CompanyName" "${APP_PUBLISHER}"
VIAddVersionKey "FileDescription" "${APP_NAME} Installer"
VIAddVersionKey "FileVersion" "${APP_VERSION}"

Section "Main Application" SecMain
  SetOutPath "$INSTDIR"
  
  ; Copy application files
  File /r "C:\Users\roxas\OneDrive\Desktop\PROJECTS\MixFade\Prototype4\dist-renderer\*"
  File /r "C:\Users\roxas\OneDrive\Desktop\PROJECTS\MixFade\Prototype4\dist\main\*"
  File "C:\Users\roxas\OneDrive\Desktop\PROJECTS\MixFade\Prototype4\package.json"
  
  ; Create executable wrapper
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; Registry entries
  WriteRegStr HKLM "Software\${APP_NAME}" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "${APP_PUBLISHER}"
  
  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\main.cjs" "" "$INSTDIR\mixfade_icon-icoext.ico"
  CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\main.cjs" "" "$INSTDIR\mixfade_icon-icoext.ico"
SectionEnd

Section "Uninstall"
  ; Remove files
  RMDir /r "$INSTDIR"
  
  ; Remove shortcuts
  Delete "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk"
  RMDir "$SMPROGRAMS\${APP_NAME}"
  Delete "$DESKTOP\${APP_NAME}.lnk"
  
  ; Remove registry entries
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
  DeleteRegKey HKLM "Software\${APP_NAME}"
SectionEnd
