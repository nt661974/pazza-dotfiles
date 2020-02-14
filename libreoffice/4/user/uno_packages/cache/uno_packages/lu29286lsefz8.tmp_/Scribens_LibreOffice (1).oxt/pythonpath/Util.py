'''
Scribens Copyright
Plugin for Open Office/Libre Office
Moduleauthor:: Scribens Team
'''

import subprocess
#import webbrowser
import ctypes
import socket

# Util functions for the plugin

# Generate a free port for websocket
def GeneratePort():

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("",0))
    s.listen(1)
    port = s.getsockname()[1]
    s.close()

    return port

# Problem of openinf windows.
# The aim is to open a new window and to adjust it size.
# We can use the library webbrowser, but os.environ.get("DISPLAY") and register_X_browsers() for initialisation doesn't walk.
# A good idea is to copy the file "webbrowser.py" and put it in the project as "webbrowser_personal.py", which allows to edit arguments
# So, finally, it run os.startfile(url) but not in a new window.
# We decide to read registers to know the default browser. Then we open the window by command line.
def OpenBrowserWindow(url, langId):

    # Get default browser.
    # 1st method : Find the default browser name then launch it with command.
    # firstMethod = False

    try:
        '''
        from winreg import HKEY_CURRENT_USER, HKEY_CLASSES_ROOT, KEY_ALL_ACCESS, OpenKey, QueryValue, QueryValueEx

        browserName = ''

        with OpenKey(HKEY_CLASSES_ROOT, "ActivatableClasses\\Package\\DefaultBrowser_NOPUBLISHERID\\Server\\DefaultBrowserServer") as key:
            keyValue = QueryValueEx(key, "ExePath")[0]
                
            if keyValue.find("chrome.exe") != -1 : browserName = "chrome.exe"
            elif keyValue.find("firefox.exe") != -1 : browserName = "firefox.exe"
            elif keyValue.find("iexplore.exe") != -1 : browserName = "iexplore.exe"
            elif keyValue.find("Opera") != -1 : browserName = "launcher.exe"
            elif keyValue.find("Safari.exe") != -1 : browserName = "Safari.exe"
           
        if len(browserName) == 0 :
            with OpenKey(HKEY_CLASSES_ROOT, "http\\shell\\open\\command") as key:
                keyValue = QueryValueEx(key, "ExePath")[0]
 
                if keyValue.find("chrome.exe") != -1  :browserName = "chrome.exe"
                elif keyValue.find("firefox.exe") != -1 : browserName = "firefox.exe"
                elif keyValue.find("iexplore.exe") != -1 : browserName = "iexplore.exe"
                elif keyValue.find("Opera") != -1 : browserName = "launcher.exe"
                elif keyValue.find("Safari.exe") != -1 : browserName = "Safari.exe"
           
        if len(browserName) == 0 :
            with OpenKey(HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice") as key:
                keyValue = QueryValue(key, 'ProgId')

                if keyValue.find("IE.HTTP") : browserName = "iexplore.exe"
                elif keyValue.find("FirefoxURL") : browserName = "firefox.exe"
                elif keyValue.find("ChromeHTML") : browserName = "chrome.exe"
                
        # Launch the command
        if len(browserName) > 0 :

            commandLine = ''

            # Chrome
            if browserName == 'chrome.exe' :
                commandLine = "cmd.exe /C start chrome.exe -app=" + "\"" + url + "\"" + " -new-window --window-size=980,600"  # Size doesn't work
            # Firefox
            elif browserName == 'firefox.exe' :
                commandLine = "cmd.exe /C start firefox.exe -width 980 -height 600 -new-window " + url
            # IE
            elif browserName == 'iexplore.exe' :
                commandLine = "cmd.exe /C start iexplore.exe " + url

            if len(commandLine) > 0 :
                subprocess.Popen(commandLine)
                firstMethod = True
		'''
        
        # Chrome is the only browser to connect to the websocket server in https.
        commandLine = "cmd.exe /C start chrome.exe -app=" + "\"" + url + "\"" + " -new-window --window-size=980,600"  # Size doesn't work
        
        p = subprocess.Popen(commandLine)
        p.communicate()
        
        # If chrome.exe doesn't exist, then show a message
        if p.returncode != 0 :
            if langId == 'FR' : ctypes.windll.user32.MessageBoxW(0, "Cette extension fonctionne uniquement avec le navigateur Google Chrome. Veuillez installer Google Chrome.", "Google Chrome est requis.", 1)
            elif langId == 'EN' : ctypes.windll.user32.MessageBoxW(0, "This extension works only with Google Chrome. Please install Google Chrome.", "Google Chrome is required.", 1)
    
    except Exception as e:
        a = 1

# Second method : Library webbrowser
#if firstMethod == False :
#webbrowser.open_new(url)