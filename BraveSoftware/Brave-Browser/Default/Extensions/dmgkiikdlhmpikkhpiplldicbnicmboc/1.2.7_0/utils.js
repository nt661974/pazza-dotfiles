
// Cherche puis retourne le couple : nodeBody, window
function SearchNodeBody()
{
	var activeElement = document.activeElement;
	if(activeElement)
	{
		//alert(activeElement.outerHTML);
		//alert(activeElement.value);
		//alert(activeElement.textContent);
		//alert(activeElement.innerHTML);
		
		// IFrame
		if(activeElement.nodeName == 'IFRAME')
		{
			var contentW = activeElement.contentWindow;
			if(contentW)
			{
				//alert(contentW.document.outerHTML);	// Mail.com
				//alert(frames.length);
				//alert(frames[2].contentDocument);
				
				var selection = contentW.getSelection();
				if(selection)
				{
					var selRange = selection.getRangeAt(0);
					if(selRange)
					{
						var nodeStart = selRange.startContainer;
						
						// Remonte a la racine pour trouver le nodebody
						if(nodeStart)
						{
							var nodeB = nodeStart;
							for(var i = 0; i < 100; i++)
							{
								if(nodeB && nodeB.nodeName == 'BODY')
								{
									// Enregistre l'evenement de focus
									//contentW.onfocus = OnFocus;
									var nodeBodyTab = new Object();
									nodeBodyTab[0] = nodeB;
									nodeBodyTab[1] = contentW;
									
									return nodeBodyTab;
								}
								nodeB = nodeB.parentNode;
							}
						}
					}
				}
			}
		}
		// Zone de texte div (Ex : Gmail)
		//alert(activeElement.parentNode.innerHTML);
		else if(activeElement.nodeName == 'DIV')
		{
			//var idAtt = activeElement.getAttribute('id');
			//var roleAtt = activeElement.getAttribute('role');
			var contentEditableAtt = activeElement.getAttribute('contenteditable');
		
			// Gmail, Yahoo
			if(contentEditableAtt && contentEditableAtt == 'true')
			{
				var nodeBodyTab = new Object();
				nodeBodyTab[0] = activeElement;
				nodeBodyTab[1] = null;
				
				return nodeBodyTab;
			}
			
			/*if(roleAtt && roleAtt == 'textbox' &&
			   contentEditableAtt && contentEditableAtt == 'true')
			{
				return activeElement;
			}
			// Yahoo
			if(idAtt && idAtt == 'rtetext' &&
			   roleAtt && roleAtt == 'document' &&
			   contentEditableAtt && contentEditableAtt == 'true')
			{
				return activeElement;
			}*/
		}
		// TextArea toute simple ou input de type texte (=TextField)
		else if(activeElement.nodeName == 'TEXTAREA' ||
			   (activeElement.nodeName == 'INPUT' && activeElement.getAttribute('type') && activeElement.getAttribute('type') == 'text'))
		{
			//alert(activeElement.outerHTML);
			//alert(activeElement.value);
			var nodeBodyTab = new Object();
			nodeBodyTab[0] = activeElement;
			nodeBodyTab[1] = null;
				
			return nodeBodyTab;
		}
	}
}


// Retourne l'ensemble du texte sous forme d'une liste de paragraphes.
function GetText(nodeBody)
{
	// TextArea simple.
	if(nodeBody.nodeName == "TEXTAREA" ||
	  (nodeBody.nodeName == 'INPUT' && nodeBody.getAttribute('type') && nodeBody.getAttribute('type') == 'text'))
	{
		var textSt = '';
		var tabSt = nodeBody.value.split('\n');
		for(var i = 0; i < tabSt.length; i++)
		{
			textSt += '[[[p]]]';
			textSt += tabSt[i];
		}
		return textSt;
	}
	// Cas general DIV, P
	else
	{
		Text = '';
		CntP = 0;
		GetP(nodeBody, -1, -1, -1, null);
		return Text;
	}
}

// Retourne le texte total.
function GetTotalText(nodeBody)
{
	// TextArea simple.
	if(nodeBody.nodeName == "TEXTAREA" ||
	  (nodeBody.nodeName == 'INPUT' && nodeBody.getAttribute('type') && nodeBody.getAttribute('type') == 'text'))
	{
		return nodeBody.value;
	}
	else return GetText(nodeBody);	// Il faut compte les sauts de lignes.
}


// Determine si la nodeBody a un texte.
function HasText(nodeBody)
{
	// TextArea simple.
	if(nodeBody.nodeName == "TEXTAREA" ||
	  (nodeBody.nodeName == 'INPUT' && nodeBody.getAttribute('type') && nodeBody.getAttribute('type') == 'text'))
	{
		return (nodeBody.value.length > 0);
	}
	else return (nodeBody.textContent.length > 0);
}

// Remplace ou supprime un ensemble de caracteres definis par un range
// char 160 : faire la comparaison avec que des espaces 160.
function ReplaceWord(indP1, pos1, indP2, pos2, nvText, textToReplace, supp, nodeBody, char160)
{
	if(nvText) nvText = nvText.replace("___pv___", ";");    // Le separateur etant ;, on le remplace par ___pv___
	if(textToReplace) textToReplace = textToReplace.replace("___pv___", ";");    // Le separateur etant ;, on le remplace par ___pv___
	
	var add = (indP1 == indP2 && pos1 == pos2);
	
	// Type TextArea
	if(nodeBody.nodeName == "TEXTAREA" ||
	  (nodeBody.nodeName == 'INPUT' && nodeBody.getAttribute('type') && nodeBody.getAttribute('type') == 'text'))
	{
		return RepTextArea(indP1, pos1, indP2, pos2, nvText, textToReplace, supp, add, nodeBody, char160);
	}
	// Cas general
	else
	{
		// Creer le range correspondant a la modification
		document = nodeBody.ownerDocument;
		Range = document.createRange();
	
		// Trouve les bornes du range (remplacement) ou ajoute des caracteres
		CntChar = 0;
		LockRangeStart = false;
		LockRangeEnd = false;
		LockAdd = false;
		LockFirstTextNode = false;
		CntP = 0;
		var textAdd = null;
		if(add) textAdd = nvText;
		
		GetP(nodeBody, nodeBody, indP1, pos1, (pos2 - pos1), textAdd)
	
		// Remplacement du range.
		if(add == false)
		{
			// Fait la verification du texte
			var rangeSt = Range.toString();
			//alert(rangeSt);
			
			// Remplacement
			if(supp == false)
			{
				// Fait la comparaison avec les caracteres 160.
				if(char160)
				{	
					rangeSt = rangeSt.replace(new RegExp(String.fromCharCode(32), 'g'), String.fromCharCode(160));
					textToReplace = textToReplace.replace(new RegExp(String.fromCharCode(32), 'g'), String.fromCharCode(160));
				}
			
				if(rangeSt == textToReplace || (textToReplace == "_"))
				{
					// Si le textNode correspond au rangeSt (le textNode est balise, mise en forme),
					// alors on remplace le textNode pour eviter la disparition de la mise en forme.
					var textNode = Range.endContainer;
					if(textNode && (textNode.nodeValue == rangeSt))
					{
						textNode.nodeValue = nvText;
					}
					else
					{
						//alert(rangeSt);
						// Supprime le contenu du range
						Range.deleteContents();
						// Cree un texte node et l'insere juste avant le range
						textNode = document.createTextNode (nvText);
						Range.insertNode(textNode);
					}
				}
				// Le remplacement ne corresponds pas au texte a remplacer.
				else return false;
			}
			// Suppression
			else
			{
				// Supprime le contenu du range
				Range.deleteContents();
				
				// Cas particulier (DIV et P) : Si le nodeP ne contient plus rien, il faut lui rajouter un <Br> dans la balise div.
				//if(textAreaStructure == 'DIV' || textAreaStructure == 'P')
				/*{
					if(EstDivVide(nodeStart))
					{
						var nodeBr = document.createElement("br");
						nodeStart.appendChild(nodeBr);
						//alert(nodeBody.outerHTML);
					}
					
				}*/
			}
		}
	}
	
	return true;
}

// Fonction de remplacement dans le cas du texteArea.
function RepTextArea(indP1, pos1, indP2, pos2, nvText, textToReplace, supp, add, nodeBody,char160)
{
	var tabSt = nodeBody.value.split('\n');
		
	// Cherche le textP et effectue le remplacement.
	var textP = tabSt[indP1];
	
	if(supp == false)
	{
		// Remplacement
		if(add == false)
		{
			var textToRep = textP.substr(pos1, pos2 - pos1);
			if(char160)
			{	
				textToRep = textToRep.replace(new RegExp(String.fromCharCode(32), 'g'), String.fromCharCode(160));
				textToReplace = textToReplace.replace(new RegExp(String.fromCharCode(32), 'g'), String.fromCharCode(160));
			}
				
			if(textToRep == textToReplace || (textToReplace == "_"))
			{
				var nvTextP = textP.substr(0, pos1) + nvText + textP.substr(pos2, textP.length - pos2);
				tabSt[indP1] = nvTextP;
			}
			// Le remplacement ne corresponds pas au texte a remplacer.
			else return false;
		}
		// Ajout
		else
		{
			var nvTextP = textP.substr(0, pos1) + nvText + textP.substr(pos1, textP.length);
			tabSt[indP1] = nvTextP;
		}
	}
	else
	// Suppression
	{
		var nvTextP = textP.substr(0, pos1) + textP.substr(pos2, textP.length);
		tabSt[indP1] = nvTextP;
	}
	
	// Recompose le texte.
	var textSt = '';
	for(var i = 0; i < tabSt.length; i++)
	{
		textSt += tabSt[i];
		if(i != (tabSt.length - 1)) textSt += '\n';
	}
	//alert(textSt);
	nodeBody.value = textSt;
	
	return true;
}


// Parcours de l'arbre de gauche a droite pour trouver les P.
// node : node du body
// indP : indice du P ou s'effectue la modification
// offset : position dans P du mot a remplacer
// wordLength : longueur dun mot a remplacer
// textAdd : texte a ajouter dans le cas d'un ajout
function GetP(node, nodeBody, indP, offset, wordLength, textAdd)
{
	// Cas particulier : Une DIV ou P ou UL n'a pas de texte. Elle doit obligatoirement etre rempli avec une balise, qui est BR.
	if(EstDivVide(node))
	{
		var vectNode = [];
		vectNode.push(node);
		
		Text = Text + '[[[p]]]';
			
		// Cas d'un remplacement ou d'un ajout. On a l'ensemble des node d'un P.
		if((indP > -1) && (indP == CntP))
		{	
			Rep(vectNode, offset, wordLength, textAdd, true);
		}
			
		CntP = CntP + 1;
	}
	else
	{
		for (var i = 0; i < node.childNodes.length; i++)
		{
			var childNode = node.childNodes[i];
			var name = childNode.nodeName;
			
			// Cas particulier : eviter balise Style dans brouiilons de Hotmail)
			if(name == 'STYLE') continue;
			//alert(name);
			// Parcours jusqu'a ce qu'il y ai une balise DIV, P ou UL.
			var lock;
			var textP = '';
			var vectNode = [];	// Ensemble des Node qui constitue le paragraphes.
			
			// Cas particulier (ex : live) : 1er paragraphe : des textNode. 2eme paragraphe : DIV. Si on supprime le 1er paragraphe, il ne reste plus qu'un textnode de longueur 0. Le child suivant est un DIV.
			if(AjoutP0(childNode, nodeBody, indP, offset, textAdd)) break;
			
			while((name != 'DIV') && (name != 'P') && (name != 'UL') && (name != 'LI') && (name != 'BR'))
			{
				textP = textP + childNode.textContent;
				
				if(indP > -1) vectNode.push(childNode);
				
				// Cas particulier : si le textnode est un saut de ligne (cas particulier des brouiilons de Hotmail).
				if(TextNodeSautDeLigne(childNode)) textP = '';
				// Commentaires
				//alert(textP);
				//if(textP.indexOf('<!--') == 0) textP = '';
				
				//alert(textP);
				if(i < (node.childNodes.length - 1))
				{
					childNode = node.childNodes[i + 1];
					name = childNode.nodeName;
					i++;
				}
				else
				{
					childNode = null;
					break;
				}
			}
			
			if(textP.length > 0)
			{
				Text = Text + '[[[p]]]' + textP;
				
				// Cas d'un remplacement ou d'un ajout. On a l'ensemble des node d'un P.
				if((indP > -1) && (indP == CntP))
				{	
					Rep(vectNode, offset, wordLength, textAdd, false);
					
					CntP = CntP + 1;
					break;
				}
				
				CntP = CntP + 1;
			}
			
			if(childNode != null)
			{
				//alert(childNode.outerHTML);
				GetP(childNode, nodeBody, indP, offset, wordLength, textAdd);
			}
		}
	}
}

// Determine si le DIV est vide, c'est a dire avec un texte de longueur 0. Il contient souvent un BR a la fin.
// La div vide peux contenir plusieurs textNode de longueur 0 (Etonnant !). Notamment apres avoir supprime puis rajouter des caracteres.
function EstDivVide(node)
{
	if(node)
	{
		if(node.textContent.length == 0)
		{
			//alert(node.nodeName);
			if((node.nodeName == 'DIV') || (node.nodeName == 'P') || (node.nodeName == 'UL') || (node.nodeName == 'LI'))
			{
				/*var containBr = false;
				//alert('compo');
				for(var i = 0; i < node.childNodes.length; i++)
				{
					var childNode = node.childNodes[i];
					//alert(childNode.nodeName);
					if(childNode.nodeName == 'BR')
					{
						containBr = true;
						break;
					}
				}
				
				if(containBr == false)
				{*/
					return true;
				//}
			}
		}
		
		// Cas <BR>n*TextNodeVide<BR>
		if(node.nodeName == 'BR')
		{
			var nextNode = node.nextSibling;
			var divVide = false;
			
			while(nextNode != null)
			{
				/*if(nextNode.textContent.length > 0)
				{
					return false;
				}*/
				
				if(nextNode.nodeName == 'BR')
				{
					return true;
				}
				
				if(nextNode.nodeName == '#text' && nextNode.textContent.length == 0)
				{
					nextNode = nextNode.nextSibling;
				}
				else return false;
			}
		}
	}

	return false;
}

// Determine si le textnode est un saut de ligne (cas particulier des brouiilons de Hotmail).
function TextNodeSautDeLigne(node)
{
	var cntSautLigne = 0;
	for(var v = 0; v < node.textContent.length; v++)
	{
		if(node.textContent.charCodeAt(v) == 10) cntSautLigne = cntSautLigne + 1;
	}
	
	if(cntSautLigne > 0 && (cntSautLigne == node.textContent.length)) return true;
	else return false;
}

// Fonction de remplacement ou d'ajout.
// Parcours l'arbre pour trouver les textNode.
// nodeBody : node du body
// offset : position dans P du mot a remplacer
// wordLength : longueur dun mot a remplacer
// textAdd : texte a ajouter dans le cas d'un ajout
// DIVVide : si le P a un texte vide
function Rep(vectNode, offset, wordLength, textAdd, DIVVide)
{
	if(DIVVide == false)
	{
		for (var i = 0; i < vectNode.length; i++)
		{
			var node = vectNode[i];
			
			if(node.nodeName == '#text') CntInTextNode(node, offset, wordLength, textAdd);
			else
			{
				for (var u = 0; u < node.childNodes.length; u++)
				{
					var childNode = node.childNodes[u];
				
					// TextNode
					if(childNode.nodeName == '#text') CntInTextNode(childNode, offset, wordLength, textAdd);
					else
					{
						var newVectNode = [];
						newVectNode.push(childNode);
						Rep(newVectNode, offset, wordLength, textAdd, DIVVide);
					}
				}
			}
		}
	}
	// Cas particulier d'un DIV vide. <DIV><BR></DIV>. Ajout.
	else
	{
		if(textAdd)
		{
			var textNode = document.createTextNode(textAdd);
			var node = vectNode[0];
			if(node.nodeName != 'BR')
			{
				node.insertBefore(textNode, node.childNodes[0]);	// Le met avant le BR.
			}
			else
			{
				node.parentNode.insertBefore(textNode, node.nextSibling);	// Le met apres le BR qui suit le node.
			}
		}
	}
}

// Traitement dans le texte node
function CntInTextNode(node, offset, wordLength, textAdd)
{
	var nbChar = node.textContent.length;
	var nbCharPrec = CntChar;
	CntChar = CntChar + nbChar;		// CntChar : compteur de charactere depuis le debut du P.
	
	if(CntChar >= offset)
	{
		if(textAdd == null)
		{
			// Start
			if(LockRangeStart == false)
			{
				LockRangeStart = true;
				//alert(offset - (CntChar - nbChar));
				Range.setStart(node, offset - (CntChar - nbChar));
			}
			
			// End
			if(CntChar >= (offset + wordLength))
			{
				if(LockRangeEnd == false)
				{
					LockRangeEnd = true;
					//alert((offset + wordLength) - nbCharPrec);
					Range.setEnd(node, (offset + wordLength) - nbCharPrec);
				}
			}
		}
		// Ajout de caracteres
		else
		{
			// Remplace la valeur. Modifie le textNode : tres fiable.
			if(LockAdd == false)
			{
				LockAdd = true;
				var st = node.nodeValue;
				node.nodeValue = st.substring(0, offset - (CntChar - nbChar)) + textAdd + st.substring(offset - (CntChar - nbChar), st.length);
			}
		}

	}
}

// Cas particulier (ex : Live) : 1er paragraphe : des textNode. 2eme paragraphe : DIV. Si on supprime le 1er paragraphe, il ne reste plus qu'un textnode de longueur 0. Le child suivant est un DIV.
function AjoutP0(node, nodeBody, indP, offset, textAdd)
{
	if(indP == 0 && offset == 0)
	{
		if(node.nodeName == '#text' && node.textContent.length == 0)
		{
			if(LockFirstTextNode == false)
			{
				LockFirstTextNode = true;
				//if(node.textContent.length == 0)
				//{
					// 1er cas : textNode vide avec une DIV ensuite.
					// 2nd cas : textNode vide avec nodeBody de longueur text 0.
					var parentNode = node.parentNode;
					if((node == parentNode.childNodes[0] && parentNode.childNodes.length > 1 && (parentNode.childNodes[1].nodeName == 'DIV' || parentNode.childNodes[1].nodeName == 'BR')) ||
					   (nodeBody.textContent.length == 0))
					{
						node.nodeValue = textAdd;
						return true;
					}
				//}
			}
		}
	}
	
	return false;
}
