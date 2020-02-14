// Represente les actions js sur la page de l'onglet d'id precise dans sendMessage, au moment de cliquer sur le bouton.

// Map des node Body. Cle : idClient. Valeur : nodeBody
var MapNodeBody = new Object();

// Map des textes precedents. Cle : idClient. Valeur : Texte precedent
var MapTextPrec = new Object();

// Map des textChanged. Cle : idClient. Valeur : si le texte a ete modifie.
var MapTextChanged = new Object();

// Map des InitFinished. Cle : idClient. Valeur : si la verification a ete initialisee.
var MapInitFinished = new Object();

// Map des windows. Cle : id. Valeur : window
var MapWindows = new Object();

// Map des windows Scribens. Cle : id. Valeur : window
var MapWindowsSc = new Object();

// Variable de Focus
var FocusLock = true;

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	var message = request.greeting;

	// Click sur le bouton.
	if (message.indexOf("BtnClick") == 0)
    {
		var tabSt = message.split("_");	
	
		var cntBtnClick = tabSt[1];
	
		var langId = tabSt[3];
	
		//alert(langId);
		
		// Cherche le nodeBody
		var nodeBodyTab = SearchNodeBody();
		
		nodeBody = nodeBodyTab[0];
		
		//alert(nodeBody.outerHTML);
		//alert(nodeBody.childNodes[0].nodeName);
		//alert(nodeBody.childNodes[0].textContent.length);
		
		// Stocke le nodeBody dans la map
		// Ne fait rien s'il n'y aucune balise. En effet, on ne peux pas determine le type de structure.
		if(nodeBody != null)
		{
			// Verifie si le node existe deja
			var idNum = -1;
			for(var i = 1; i <= cntBtnClick; i++)
			{
				if(MapNodeBody[i] == nodeBody)
				{
					idNum = i;
					break;
				}
			}
			// Si le noeud n'existe pas, alors le met dans la map et on ouvre une nouvelle fenetre.
			if(idNum == -1)
			{
				MapNodeBody[cntBtnClick] = nodeBody;
				
				//alert(GetText(nodeBody));
				
				// Que si texte disponible
				if(HasText(nodeBody))
				{
					// En second, la window ou l'on applique l'evenement de focus. Ex : live.fr
					if(nodeBodyTab[1] != null) nodeBodyTab[1].onfocus = OnFocus;
				
					// Creer la nouvelle fenetre.
					CreateNewWindow(cntBtnClick, langId);
					
					// Envoi un message pour enregistrer l'idClient dans la table des TabId.
					sendResponse({RegisterIdClient: cntBtnClick + '_' + tabSt[2]});
				}
			}
			// Le noeud existe.
			else
			{
				// Que si texte disponible
				if(HasText(MapNodeBody[idNum]))
				{
					var wnd = MapWindowsSc[idNum];
					
					// On creer une nouvelle fenetre.
					if(wnd == null || wnd.closed)
					{
						// Reinitialise les parametres
						MapInitFinished[idNum] = false;
						FocusLock = true;
						
						CreateNewWindow(idNum, langId);
					}
					// On fait une simple verification.
					else
					{
						wnd.focus();
						wnd.postMessage('CHECK_TEXT:' + GetText(MapNodeBody[idNum]), "*");
					}
				}
			}
		}
	}
	
	// Fermeture de la fenetre.
	//message = request.closewindow;
	/*if(message != null && message.length > 0)
	{
		alert(message);
		var wnd = MapWindowsSc[message];
		if(wnd)
		{
			wnd.close();
		}
	}*/
	
});


// Creer une nouvelle fenetre de correction
function CreateNewWindow(idClient, langId)
{
	var w = 1200;
	var h = 600;
	var left = (screen.width/2)-(w/2);
	var top = (screen.height/2)-(h/2);
	
	// Choice of lang
	var url = '';
	if(langId == 'fr') url = 'https://www.scribens.fr';
	else if(langId == 'en') url = 'https://www.scribens.com';
	
	var WindowsSc = window.open(url + '/plugin.html?plugin=Chrome&&version=2&&idclient=' + idClient, idClient, 'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top + ',titlebar=no');
	//var Window = window.open('http://127.0.0.1:8888/Cor.html?gwt.codesvr=127.0.0.1:9997&&plugin=Chrome&&version=2&&idclient=' + idClient, idClient, 'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top + ',titlebar=no');
	
	MapWindowsSc[idClient] = WindowsSc;
	
	// Initialise les evenements. L'objet window correspond a la fenetre de l'onglet. 
	window.addEventListener ("message", OnMessage, false);
	
	// NE PAS UTILISER FOCUS UNIQUEMENT SUR LE WINDOW, car celle-ci peux comporter plusieurs frame, window de zone de texte. Ex : Hotmail. Il faut donc appliquer des evenements de focus pour chaque window.
	window.addEventListener ("focus", OnFocus, false);	
	
	// These events doesn't work.
	
	//window.addEventListener ("close", OnClose, false);	
	//window.addEventListener ("unload", OnUnload, false);
	// onbeforeunload

	// Normalement, il s'agit de l'evenement pour detecter la fermeture d'une fenetre ou d'un onglet. Mais cela ne focntionne pas.
	//window.addEventListener ("beforeunload", OnUnload, false);	
	//window.onbeforeunload = function () {
    //    alert('a');
    //}
}


// Reception de messages
function OnMessage(event) {
	var message = event.data;
	
	var indSl = message.indexOf("_");
	var idClient = -1;
	if(indSl > 0)
	{
		idClient = parseInt(message.substr(0, indSl));
		message = message.substr(indSl + 1, message.length - (indSl + 1));
	}
	
	// Ne fonctionne pas.
	//var windowSource = event.source;
	//if(windowSource) idClient = windowSource.name;
	
	// Init finished. Fait un GetText	
	if(message == "INIT_FINISHED")
	{
		MapInitFinished[idClient] = true;
	
		// Rempli la map des textes (pour la comparaison)
		
		MapTextPrec[idClient] = GetTotalText(MapNodeBody[idClient]);
		
		var wnd = MapWindowsSc[idClient];
		if(wnd)
		{
			//alert(GetText(MapNodeBody[idClient]));
			wnd.postMessage('CHECK_TEXT:' + GetText(MapNodeBody[idClient]), "*");
		}
	}				
	// Evenement focus -> Check text
	else if(message == "FOCUS" && MapInitFinished[idClient] == true)
	{
		// Texte actuel.
		var totalText = GetTotalText(MapNodeBody[idClient]);

		// Si le texte est different, lance une requete GetText.
		if((totalText != MapTextPrec[idClient]) ||
		   (MapTextChanged[idClient] == true))	// Ou si le texte a ete modifie (remplacement, ajout de caractere, etc.)
		{
			if(FocusLock == true)
			{
				//alert('a');
				//alert(MapTextChanged[idClient]);
				MapTextChanged[idClient] = false;
				var wnd = MapWindowsSc[idClient];
				if(wnd) wnd.postMessage('CHECK_TEXT:' + GetText(MapNodeBody[idClient]), "*");
			}
		}
		
		MapTextPrec[idClient] = totalText;
		
		FocusLock = false;
	}
	// Remplacement ou suppression. Fait un GetText
	else if(message.indexOf("REP:") == 0 ||	// Remplacement
			message.indexOf("REM:") == 0)	// Suppression
	{
		var fields = message.substr(4, (message.length - 4));
		var tabSt = fields.split(";");
		var supp = (message.indexOf("REM:") == 0);
		
		var sucess = ReplaceWord(parseInt(tabSt[0]), parseInt(tabSt[1]), parseInt(tabSt[2]), parseInt(tabSt[3]), tabSt[4], tabSt[5], supp, MapNodeBody[idClient], false);
		
		if(sucess == true)
		{
			MapTextChanged[idClient] = true;
		}
		// Si le remplacement a connu un probleme, il faut absolument refaire un CHECK_TEXT afin de synchroniser les 2 textes.
		// On envoie PB_REMPLACEMENT puis GetText, car on ne peux pas faire 2 postMessage a la fois.
		else
		{
			var wnd = MapWindowsSc[idClient];
			if(wnd)
			{
				wnd.postMessage('CHECK_TEXT:' + GetText(MapNodeBody[idClient]), "*");
				
				wnd.postMessage('PB_REMPLACEMENT', "*");
			}
		}
		
		// Met a jour la map du textPrec.
		MapTextPrec[idClient] = GetTotalText(MapNodeBody[idClient]);
	}
}

// Evenement de focus sur la fentre principale de chrome.
function OnFocus() {
	FocusLock = true;
}