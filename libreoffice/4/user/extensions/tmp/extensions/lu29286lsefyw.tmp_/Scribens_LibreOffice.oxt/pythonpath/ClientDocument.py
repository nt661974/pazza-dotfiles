'''
Scribens Copyright
Plugin for Open Office/Libre Office
Moduleauthor:: Scribens Team
'''

import ctypes

# Class of the document
class ClientDocument(object):

    # Init
    def __init__(self, doc):
        
        self.XDoc = doc
        self.XSelectionSupplier = doc.getCurrentController()

        # By default, set Connected to False
        self.Connected = False
        self.InitFinished = False
        self.Socket = None

        # Previous text
        self.TextPrec = ''

        # Index of first and last paragraph of the selection
        self.IndPSel_Start = 0
        self.IndPSel_End = 0

        # Previous selection
        self.SelectionPrec = None
        self.SelectionPrec2 = None

    # Get the total text
    def GetText(self):
        text = ''

        parEnum = self.XDoc.Text.createEnumeration()
        
        while parEnum.hasMoreElements:

            try:
                par = parEnum.nextElement()
                if par.supportsService("com.sun.star.text.Paragraph") :
                    
                    text += "[[[p]]]";
                    
                    textParagraph = par.String
                    textParagraph = textParagraph.replace("\n", " ");
                    textParagraph = textParagraph.replace("\r", " ");

                    text += textParagraph

            except:     #hasMoreElements doesn't work
                break

        return text

    # Get text of the selection
    def GetTextSel(self):

        text = ''

        xIndexAccess = self.XSelectionSupplier.Selection
        count = xIndexAccess.getCount();
        
        parFirst = None
        parEnd = None

        if count == 1:  # Only one selection is allowed
             xTextRange = xIndexAccess.getByIndex(0);
             
             parEnum = xTextRange.createEnumeration()
        
             while parEnum.hasMoreElements:
                try:
                    par = parEnum.nextElement()
                    if par.supportsService("com.sun.star.text.Paragraph") :
                        text += "[[[p]]]";
                    
                        textParagraph = par.String
                        textParagraph = textParagraph.replace("\n", " ");
                        textParagraph = textParagraph.replace("\r", " ");

                        text += textParagraph

                        if parFirst == None : parFirst = par
                        parEnd = par

                except:     #hasMoreElements doesn't work
                     break 
            
             counterPar = 0

             parEnum = self.XDoc.Text.createEnumeration()
        
             while parEnum.hasMoreElements:
                 try:
                     par = parEnum.nextElement()
                    
                     # Paragraphs have different adresses, so we compare StringValue, which is the id of the string.
                     if par.StringValue == parFirst.StringValue : self.IndPSel_Start = counterPar
                     if par.StringValue == parEnd.StringValue : self.IndPSel_End = counterPar

                     #ctypes.windll.user32.MessageBoxW(0, "", par.String, 1)

                     counterPar = counterPar + 1

                 except:     #hasMoreElements doesn't work
                     break 
            


        return text

    # Get paragraphs text of the selection
    def GetTextParSel(self):

        text = ''

        counterPar = 0

        parEnum = self.XDoc.Text.createEnumeration()
        
        while parEnum.hasMoreElements:
            try:
                par = parEnum.nextElement()
                    
                if counterPar >= self.IndPSel_Start and counterPar <= self.IndPSel_End :
                    text += "[[[p]]]";
                    
                    textParagraph = par.String
                    textParagraph = textParagraph.replace("\n", " ");
                    textParagraph = textParagraph.replace("\r", " ");

                    text += textParagraph

                counterPar = counterPar + 1

            except:     #hasMoreElements doesn't work
                break

        return text

    # Get selection object
    def GetSelection(self):
        return self.XSelectionSupplier.Selection

    # Replace word
    def ReplaceWord(self, indPar1, pos1, indPar2, pos2, newText, wordToReplace):

        if len(newText) > 0 and len(wordToReplace) > 0 :
            newText = newText.replace("___pv___", ";")    # The separator is ; so we replace it by ___pv___
            wordToReplace = wordToReplace.replace("___pv___", ";");    # The separator is ; so we replace it by ___pv___

        parEnum = self.XDoc.Text.createEnumeration()
        
        cntPar = 0

        while parEnum.hasMoreElements:

            try:
                par = parEnum.nextElement()
                if par.supportsService("com.sun.star.text.Paragraph") :
                    
                    textParagraph = par.String

                    # Detect the right paragraph
                    if cntPar == (indPar1 + self.IndPSel_Start):

                        xTextRange = par.Anchor
                        xTextCursor = xTextRange.Text.createTextCursorByRange(xTextRange)

                        # Supprime le mot puis le remplace
                        xTextCursor.goRight(int(pos1), False)
                        xTextCursor.goRight(int(pos2 - pos1), True)
                        
                        rangeSt = xTextCursor.getString()
            
                        # By security, check that the text to replace is the same as the original word. Else show a message and don't replace.
                        repMot = True
                        if len(wordToReplace) > 0 and wordToReplace != "_" :
                            
                            # Harmonize spaces 160 and 32
                            wordToReplace = wordToReplace.replace(u"\u00A0", u"\u0020")
                            rangeSt = rangeSt.replace(u"\u00A0", u"\u0020")

                            if rangeSt != wordToReplace :
                                    
                                # Message : available only on Windows. 
                                try:
                                    ctypes.windll.user32.MessageBoxW(0, "", "Unable to replace", 1)
                                except:
                                    a = 1

                                repMot = False
                        
                        if repMot : xTextCursor.setString(newText)

                    cntPar = cntPar + 1

            except:     #hasMoreElements doesn't work
                break
    