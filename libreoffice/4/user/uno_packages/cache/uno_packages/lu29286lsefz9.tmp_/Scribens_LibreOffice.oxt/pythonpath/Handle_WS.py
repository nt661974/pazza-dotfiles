'''
Scribens Copyright
Plugin for Open Office/Libre Office
Moduleauthor:: Scribens Team
'''

import SimpleWebSocketServer
import ClientDocument

import ctypes

# Map of client documents. Key : Id of the client document. Value : Client document.
global MapDocs
MapDocs = {}

# Handle of the web socket
class Handle_WS(SimpleWebSocketServer.WebSocket):

   def handleMessage(self):

      message = self.data
      
      #if message.find("REP:") >= 0 : ctypes.windll.user32.MessageBoxW(0, "", message, 1)

      idClient = -1

      indSl = message.find("_")
      if indSl > 0 :
          idClient = int(message[0:indSl])
          message = message[indSl + 1:]

      clientDocument = MapDocs[idClient]
          
      # Init connexion
      if message == 'CONNEXION_CLIENT' :
          
          clientDocument.Connected = True
          clientDocument.Socket = self

          self.sendMessage(u"CONNEXION_OK")     # u is necessary for Python version < 3 (Open Office)
          
          clientDocument.TextPrec = clientDocument.GetTextParSel()

          #clientDocument.SelectionPrec = clientDocument.GetSelection()
          #clientDocument.SelectionPrec2 = clientDocument.GetSelection()

      # Init finished : send text
      elif message == 'INIT_FINISHED' :
          
          clientDocument.InitFinished = True
          
          self.sendMessage(u'CHECK_TEXT:' + clientDocument.GetTextSel())
      
      # Focus. Review the text
      # Important notes: To replace Lock Focus (= Focus on the LibreOffice window), we wanted to use selection address.
      # But when focus message appears, there are two different selection objects. It doesn't walk. So we simplify.But not optimized update.
      elif message == 'FOCUS' :
          
          if clientDocument.InitFinished == True:
                
                text = clientDocument.GetTextParSel()

                if text != clientDocument.TextPrec :
                    self.sendMessage(u'CHECK_TEXT:' + text)
                    #ctypes.windll.user32.MessageBoxW(0, "", "OK", 1)

                clientDocument.TextPrec = text
              
                #selection = clientDocument.GetSelection()

                #tr1 = selection.getByIndex(0)
                #tr2 = clientDocument.SelectionPrec.getByIndex(0)

                #ctypes.windll.user32.MessageBoxW(0, "", hex(id(selection.getByIndex(0))), 1)
                #ctypes.windll.user32.MessageBoxW(0, "", hex(id(clientDocument.XSelectionSupplier)), 1)
                #ctypes.windll.user32.MessageBoxW(0, "", hex(id(tr1)), 1)
                #ctypes.windll.user32.MessageBoxW(0, "", hex(id(tr2)), 1)
                #ctypes.windll.user32.MessageBoxW(0, "", hex(id(selection)), 1)
                #ctypes.windll.user32.MessageBoxW(0, "", hex(id(clientDocument.SelectionPrec)), 1)
                #ctypes.windll.user32.MessageBoxW(0, "", selection, 1)
                #ctypes.windll.user32.MessageBoxW(0, "", clientDocument.SelectionPrec, 1)

                #if selection.getCount() > 0 :
                    #ctypes.windll.user32.MessageBoxW(0, "", selection.getByIndex(0).String, 1)

                #if selection != None :

                    #if selection != clientDocument.SelectionPrec :
                    #if selection != clientDocument.SelectionPrec and selection != clientDocument.SelectionPrec2 :
                    #if selection.getByIndex(0) != clientDocument.SelectionPrec.getByIndex(0) :
                    #if selection.getByIndex(0).String != clientDocument.SelectionPrec.getByIndex(0).String :
                        #ctypes.windll.user32.MessageBoxW(0, "", "OK", 1)

                        #ctypes.windll.user32.MessageBoxW(0, "", hex(id(selection)), 1)
                        #ctypes.windll.user32.MessageBoxW(0, "", hex(id(clientDocument.SelectionPrec)), 1)
                        #ctypes.windll.user32.MessageBoxW(0, "", hex(id(clientDocument.SelectionPrec2)), 1)
                        #self.sendMessage('CHECK_TEXT:' + clientDocument.GetTextParSel())
                        #pass

                    #clientDocument.SelectionPrec2 = clientDocument.SelectionPrec
                    #clientDocument.SelectionPrec = selection
                
                '''
                ctypes.windll.user32.MessageBoxW(0, "", "OK", 1)
                selection = clientDocument.GetSelection()

                #text = clientDocument.GetBrutTextSel()

                #print(text)
                #print(TextPrec)

                #if text != clientDocument.TextPrec :
                ctypes.windll.user32.MessageBoxW(0, "", "OK", 1)
                #ctypes.windll.user32.MessageBoxW(0, "", selection.getByIndex(0).String, 1)
                if selection.getByIndex(0).String != clientDocument.SelectionPrec.getByIndex(0).String :

                    ctypes.windll.user32.MessageBoxW(0, "", "SEL", 1)
                    self.sendMessage('CHECK_TEXT:' + clientDocument.GetTextParSel())

                #clientDocument.TextPrec = text

                #clientDocument.SelectionPrec = clientDocument.GetSelection()
                '''   
                
      # Text to replace
      elif message.startswith("REP:") or message.startswith("REM:") :
          
          ind2p = message.find(":")
       
          st = message[ind2p + 1:]

          tabSt = st.split(';')
                            
          if message.startswith("REP"):
              clientDocument.ReplaceWord(int(tabSt[0]), int(tabSt[1]), int(tabSt[2]), int(tabSt[3]), tabSt[4], tabSt[5])
          
          elif message.startswith("REM"):
              clientDocument.ReplaceWord(int(tabSt[0]), int(tabSt[1]), int(tabSt[2]), int(tabSt[3]), "","")

          clientDocument.TextPrec = clientDocument.GetTextParSel()
   
   # Connection opened
   def handleConnected(self):
      pass

   # Connection closed
   def handleClose(self):
      #ctypes.windll.user32.MessageBoxW(0, "", "DISCONNECTED", 1)
      # Set connected to False
      for documentClient in MapDocs.values():
          if documentClient.Socket == self : 
              documentClient.Connected = False

