; Custom NSIS configuration for MixFade
; This file enhances the default electron-builder NSIS installer

; Custom installer sections
!macro customHeader
  ; Add custom header text
  !define MUI_WELCOMEPAGE_TITLE "Welcome to MixFade Setup"
  !define MUI_WELCOMEPAGE_TEXT "This will install MixFade ${VERSION} on your computer.$\r$\n$\r$\nMixFade is a professional DJ mixing application with seamless crossfading capabilities.$\r$\n$\r$\nClick Next to continue."
  
  ; Custom finish page
  !define MUI_FINISHPAGE_TITLE "MixFade Setup Complete"
  !define MUI_FINISHPAGE_TEXT "MixFade has been successfully installed on your computer.$\r$\n$\r$\nClick Finish to close this wizard."
  !define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_EXECUTABLE}"
  !define MUI_FINISHPAGE_RUN_TEXT "Launch MixFade now"
!macroend

!macro customInstall
  ; Create additional shortcuts
  CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE}" "" "$INSTDIR\${APP_EXECUTABLE}" 0
  
  ; Set file associations for audio files (optional)
  WriteRegStr HKCR ".mp3\OpenWithProgids" "MixFade.AudioFile" ""
  WriteRegStr HKCR ".wav\OpenWithProgids" "MixFade.AudioFile" ""
  WriteRegStr HKCR ".flac\OpenWithProgids" "MixFade.AudioFile" ""
  WriteRegStr HKCR ".m4a\OpenWithProgids" "MixFade.AudioFile" ""
  
  WriteRegStr HKCR "MixFade.AudioFile" "" "Audio File"
  WriteRegStr HKCR "MixFade.AudioFile\shell" "" "open"
  WriteRegStr HKCR "MixFade.AudioFile\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE}" "%1"'
  
  ; Add to Windows Programs list with proper metadata
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_REGISTRY_KEY}" "DisplayIcon" "$INSTDIR\${APP_EXECUTABLE}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_REGISTRY_KEY}" "HelpLink" "https://mixfade.app/support"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_REGISTRY_KEY}" "URLInfoAbout" "https://mixfade.app"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_REGISTRY_KEY}" "URLUpdateInfo" "https://mixfade.app/downloads"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_REGISTRY_KEY}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_REGISTRY_KEY}" "NoRepair" 1
!macroend

!macro customUnInstall
  ; Remove file associations
  DeleteRegKey HKCR ".mp3\OpenWithProgids\MixFade.AudioFile"
  DeleteRegKey HKCR ".wav\OpenWithProgids\MixFade.AudioFile"
  DeleteRegKey HKCR ".flac\OpenWithProgids\MixFade.AudioFile"
  DeleteRegKey HKCR ".m4a\OpenWithProgids\MixFade.AudioFile"
  DeleteRegKey HKCR "MixFade.AudioFile"
  
  ; Remove additional shortcuts
  Delete "$SMPROGRAMS\${PRODUCT_NAME}.lnk"
!macroend

; Custom pages (optional)
!macro customWelcomePage
  !define MUI_PAGE_CUSTOMFUNCTION_PRE WelcomePagePre
  !insertmacro MUI_PAGE_WELCOME
  
  Function WelcomePagePre
    ; You can add custom logic here if needed
  FunctionEnd
!macroend

; Version information
!macro customVersionInfo
  VIProductVersion "${VERSION}.0.0"
  VIAddVersionKey "ProductName" "${PRODUCT_NAME}"
  VIAddVersionKey "ProductVersion" "${VERSION}"
  VIAddVersionKey "CompanyName" "${COMPANY_NAME}"
  VIAddVersionKey "LegalCopyright" "© ${COMPANY_NAME}"
  VIAddVersionKey "FileDescription" "${PRODUCT_NAME} - Professional DJ Mixing Software"
  VIAddVersionKey "FileVersion" "${VERSION}"
  VIAddVersionKey "InternalName" "${PRODUCT_NAME}"
  VIAddVersionKey "OriginalFilename" "${PRODUCT_NAME}-${VERSION}-Windows-x64-Setup.exe"
!macroend 