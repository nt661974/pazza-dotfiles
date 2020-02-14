'''
Scribens Copyright
Plugin for Open Office/Libre Office
Moduleauthor:: Scribens Team
'''

import unohelper
import uno
import traceback
import signal
import sys
import ctypes
import threading

from com.sun.star.task import XJobExecutor

import Util
import Handle_WS

import ClientDocument
import SimpleWebSocketServer

global ServerLaunched
global Port
global CounterClick

ServerLaunched = False
Port = 26550
CounterClick = 0

class Launcher (unohelper.Base, XJobExecutor):
    def __init__ (self, ctx):
        self.ctx = ctx

    # XJobExecutor
    def trigger (self, sCmd):
        try:
            
            global ServerLaunched

            # Launch the web socket server
            if ServerLaunched == False :
                ServerLaunched = True
                
                # Create the web socket server.
                global Port
                Port = Util.GeneratePort()
                
                server = SimpleWebSocketServer.SimpleWebSocketServer('', Port, Handle_WS.Handle_WS)
                
                def close_sig_handler(signal, frame):
                  server.close()
                  sys.exit()

                signal.signal(signal.SIGINT, close_sig_handler)
                
                # Wait for the client. Block every instructions after.
                th = threading.Thread(target=SimpleWebSocketServer.Serveforever, args=(server,))
                th.start()
            
            # Increment the counter
            global CounterClick
            CounterClick = CounterClick + 1

            # Launch the client.
            
            # Search if the document exist in the list
            desktop = self.ctx.ServiceManager.createInstanceWithContext('com.sun.star.frame.Desktop', self.ctx)
            doc = desktop.getCurrentComponent()
            
            clientDoc = None
            for documentClientI in Handle_WS.MapDocs.values():
                if documentClientI.XDoc == doc :
                    if documentClientI.Connected == True :
                        clientDoc = documentClientI

            # Not exist : create the document.
            if clientDoc == None :
                
                clientDocument = ClientDocument.ClientDocument(doc)
                
                Handle_WS.MapDocs[CounterClick] = clientDocument

                # Create a new window
                if sCmd == 'FR' : url = 'https://www.scribens.fr'
                elif sCmd == 'EN' : url = 'https://www.scribens.com'

                url += '/plugin.html?plugin=OOWriter&&idclient='
                url += str(CounterClick) + '&&port=' + str(Port) + '&&version=2'

                Util.OpenBrowserWindow(url, sCmd)

                #ctypes.windll.user32.MessageBoxW(0, "", "New document !", 1)

            # Exist : Submit a new request of text
            else :

                text = clientDoc.GetTextSel()
                clientDoc.TextPrec = text
                clientDoc.Socket.sendMessage(u'CHECK_TEXT:' + text)

                #ctypes.windll.user32.MessageBoxW(0, "", "Document exist : Submit text !", 1)
            
        except:
            traceback.print_exc()

g_ImplementationHelper = unohelper.ImplementationHelper()
g_ImplementationHelper.addImplementation(Launcher, 'scribens.Launcher', ('com.sun.star.task.Job',))
