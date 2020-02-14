// Map des idTab. Cle : idClient, Valeur : idTab
var MapIdTabs = new Object();

// Dernier Id client.
var LastIdClient = -1;

// Compteur de click sur le bouton de verification.
var CntBtnClick = 0;

// Creation d'un nouveau item.
chrome.contextMenus.create({"title": "Scribens", "contexts":["editable"], "id": "ScribensMenu"});

chrome.contextMenus.create({"title": 'English', "contexts":["editable"], "parentId": "ScribensMenu", "onclick": BtnClick_En});

var labelFrench = 'Fran' + String.fromCharCode(231) + 'ais';
chrome.contextMenus.create({"title": labelFrench, "contexts":["editable"], "parentId": "ScribensMenu", "onclick": BtnClick_Fr});

// A la fermeture d'une tab, trouve les windows associees et les ferme.
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){

	for(var i = 0; i <= LastIdClient; i++)
	{
		if(MapIdTabs[i] == tabId)
		{
			// Ne peut pas transmettre le message car la tab est fermée.
			//alert(tabId);
			//alert(i);
			//chrome.tabs.sendMessage(tabId, {greeting: i}, function(response) {});
		}
	}
});

// Au rechargement d'une tab, trouve les windows associees et les ferme. -> problèmes sur gmail.
/*chrome.tabs.onUpdated.addListener(function(tabId, removeInfo){

	//alert('a');
	for(var i = 0; i <= CntBtnClick; i++)
	{
		if(MapIdTabs[i] == tabId)
		{
			var window = MapWindows[i];
			if(window)
			{
				chrome.windows.remove(window.id, null);
			}
		}
	}
});*/


// Evenement de focus d'une window
/*chrome.windows.onFocusChanged.addListener(function(windowId) {
	var idClient = MapIdWindows[windowId];
    if(idClient)
    {
		// Au focus de la fenetre, verifie si le texte a change. Si oui, alors lance une nouvelle verification de texte.
		var tabId = MapIdTabs[idClient];
		chrome.tabs.sendMessage(parseInt(tabId), {greeting: idClient + "_COMPARE_TEXT"}, function(response) {
			//port.postMessage({ text: response.Text });
		});
    }
});*/

// Evenement a la fermeture d'une fenetre de correction.
/*chrome.windows.onRemoved.addListener(function(windowId) {
    var idClient = MapIdWindows[windowId];
    if(idClient)
	{
		// Supprime les elements de la map
		MapWindows[idClient] = null;
		MapIdWindows[windowId] = null;
	}
});*/

// Evenement de click sur le bouton de correction. Pas necessaire. L'appui sur le contextmenu est mieux.
//chrome.browserAction.onClicked.addListener(BtnClick);

function BtnClick_En (info, tab) {

	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		
		CntBtnClick = CntBtnClick + 1;
		
		chrome.tabs.sendMessage(tabs[0].id, {greeting: "BtnClick_" + CntBtnClick + '_' + tabs[0].id + '_' + 'en'}, function(response) {
			
			// Enregistre l'idClient dans la table des IdTabs.
			if(response.RegisterIdClient)
			{
				var tabSt = response.RegisterIdClient.split("_");
			
				MapIdTabs[tabSt[0]] = tabSt[1];
				LastIdClient = tabSt[0];
			}
		});
    });
}

function BtnClick_Fr (info, tab) {

	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		
		CntBtnClick = CntBtnClick + 1;
		
		chrome.tabs.sendMessage(tabs[0].id, {greeting: "BtnClick_" + CntBtnClick + '_' + tabs[0].id + '_' + 'fr'}, function(response) {
			
			// Enregistre l'idClient dans la table des IdTabs.
			if(response.RegisterIdClient)
			{
				var tabSt = response.RegisterIdClient.split("_");
			
				MapIdTabs[tabSt[0]] = tabSt[1];
				LastIdClient = tabSt[0];
			}
		});
    });
}
