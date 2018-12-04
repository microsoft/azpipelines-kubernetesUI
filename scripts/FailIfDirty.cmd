@if not defined _echo echo off
SETLOCAL

REM A user who installs Git in a non-standard location can set _GIT_PATH
REM in the global environment so this script can find it.
IF "%_GIT_PATH%" == "" SET "_GIT_PATH=%ProgramW6432%\Git\cmd\git.exe"
IF NOT EXIST "%_GIT_PATH%" SET "_GIT_PATH=%ProgramFiles(x86)%\Git\cmd\git.exe"
IF NOT EXIST "%_GIT_PATH%" SET "_GIT_PATH=%LocalAppData%\Programs\Git\cmd\git.exe"

REM Normalize the source tree path
PUSHD %~dp0..
SET _SRC_DIR=%CD%
POPD

ECHO Checking for any pending changes in %_SRC_DIR%...
SET _ANY_CHANGES=0
PUSHD %_SRC_DIR%

REM Check for pending changes in the source tree.
IF EXIST "%_GIT_PATH%" (
  @FOR /F "tokens=1,*" %%A IN ('"%_GIT_PATH%" status -s') DO @SET _ANY_CHANGES=1 & ECHO ##vso[task.logissue type=error;sourcepath=%%B;linenumber=1;columnnumber=1;code=100;]Unexpected pending change [%%A] after build completion
) ELSE (
  ECHO WARNING: Git for Windows not installed; unable to check the source tree. 1>&2
)

@IF %_ANY_CHANGES% EQU 1 ECHO ##vso[task.logissue type=error;sourcepath=Scripts/failifdirty.cmd;linenumber=25;columnnumber=1;code=100;]One or more pending changes were found after the build. There were none when it started. This usually indicates that generated files were not submitted.

POPD
EXIT /B %_ANY_CHANGES%
