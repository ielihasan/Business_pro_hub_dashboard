@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

REM Load .env file
for /f "usebackq tokens=1,2 delims==" %%A in (".env") do (
    set "_k=%%A"
    if not "!_k!"=="" if not "!_k:~0,1!"=="#" set "%%A=%%B"
)

REM Set JAVA_HOME
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot

REM Run Spring Boot
C:\Users\X\AppData\Local\maven\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run -f "%~dp0pom.xml"
