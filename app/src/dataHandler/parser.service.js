angular.module('evtviewer.dataHandler')

.service('evtParser', function(parsedData) {
    var parser = { };

    // TODO: create module provider and add default configuration
    // var defAttributes = ['n', 'n', 'n'];
    var defPageElement = 'pb';

    /* ********* */
    /* UTILITIES */
    /* ********* */
    /* ************************************** */
    /* isNestedInElem(element, parentTagName) */
    /* *************************************************************************** */
    /* Function to check if an element is nested into another particular element   */ 
    /* @element element to be checked                                              */
    /* @parentTagName tagName of the element that does not be a parent of @element */
    /* @return boolean                                                             */
    /* *************************************************************************** */
    parser.isNestedInElem = function(element, parentTagName) {
        if (element.parentNode !== null) {
            if (element.parentNode.tagName === 'text' ) {
                return false;
            } else if (element.parentNode.tagName === parentTagName) {
                return true;
            } else {
                return parser.isNestedInElem(element.parentNode, parentTagName);
            }
        } else {
            return false;
        }
    };
    
    /* ************************ */
    /* parseXMLElement(element) */
    /* ********************************************************** */
    /* Function to parse a generic XML element                    */
    /* @element XML element to be parsed                          */
    /* @return an html with the same data as the XML element read */
    /* ********************************************************** */
    // It will transform a generic XML element into an <span> element
    // with a data-* attribute for each @attribute of the XML element
    // It will also transform its children
    parser.parseXMLElement = function(element){
        if (element.nodeType === 3 ) { // Text
            return element;
        } else {
            var newElement;
            newElement           = document.createElement('span');
            newElement.className = element.tagName;
            for (var i = 0; i < element.attributes.length; i++) {
                var attrib = element.attributes[i];
                if (attrib.specified) {
                    if (attrib.name !== 'xml:id') {
                        newElement.setAttribute('data-'+attrib.name, attrib.value);
                        if (attrib.name !== 'wit') {
                            parsedData.addCriticalEntryFilter(attrib.name, attrib.value);
                        }
                    }
                }
            }
            for (var j = 0; j < element.childNodes.length; j++) {
                newElement.appendChild(parser.parseXMLElement(element.childNodes[j]));
            }
            return newElement;
        }
    };

    /* ********************* */
    /* balanceXML(XHTMLstring) */
    /* ********************* */ 
    // balance takes an excerpted or truncated XHTML string and returns a well-balanced XHTML string
    parser.balanceXHTML = function(XHTMLstring) {
      // Check for broken tags, e.g. <stro
      // Check for a < after the last >, indicating a broken tag
      if (XHTMLstring.lastIndexOf('<') > XHTMLstring.lastIndexOf('>')) {
        // Truncate broken tag
        XHTMLstring = XHTMLstring.substring(0,XHTMLstring.lastIndexOf('<'));
      }

      // Check for broken elements, e.g. <strong>Hello, w
      // Get an array of all tags (start, end, and self-closing)
      var tags = XHTMLstring.match(/<[^>]+>/g);
      var stack = [];
      for (var tag in tags) {
        if (tags[tag].search('/') <= 0) {
          // start tag -- push onto the stack
          stack.push(tags[tag]);
        } else if (tags[tag].search('/') === 1) {
          // end tag -- pop off of the stack
          stack.pop();
        } else {
          // self-closing tag -- do nothing
        }
      }

      // stack should now contain only the start tags of the broken elements, most deeply-nested at the top
      while (stack.length > 0) {
        // pop the unmatched tag off the stack
        var endTag = stack.pop();
        // get just the tag name
        endTag = endTag.substring(1,endTag.search(/[ >]/));
        // append the end tag
        XHTMLstring += '</' + endTag + '>';
      }

      // Return the well-balanced XHTML string
      return(XHTMLstring);
    };

    /* ************************ */
    /* parseNote(docDOM) */
    /* **************************************************************************** */
    /* Function to parse an XML element representing a note (<note> in XMLT-TEI P5) */
    /* and transform it into an evtPopover directive                                */
    /* @docDOM -> XML to be parsed                                                  */
    /* **************************************************************************** */
    // It will look for every element representing a note
    // and replace it with a new evt-popover element
    parser.parseNote = function(docDOM) {
        var notes = docDOM.getElementsByTagName('note');
        var n = 0;
        while (n < notes.length) {
            var noteNode    = notes[n],
                popoverElem = document.createElement('evt-popover');
            if (noteNode.parentNode.tagName !== 'app' &&
                noteNode.parentNode.tagName !== 'evt-reading' ) {
                popoverElem.setAttribute('data-trigger', 'click');
                popoverElem.setAttribute('data-tooltip', noteNode.innerHTML);
                popoverElem.innerHTML = '&bull;';
                noteNode.parentNode.replaceChild(popoverElem, noteNode);
            } else {
                noteNode.parentNode.removeChild(noteNode);
            }
        }
    };

    parser.parseLines = function(docDOM){
        var lines = docDOM.getElementsByTagName('l');
        var n = 0;
        while (n < lines.length) {
            var lineNode    = lines[n],
                newElement = document.createElement('div');
                newElement.className = 'l';
                newElement.className = lineNode.tagName;
                for (var i = 0; i < lineNode.attributes.length; i++) {
                    var attrib = lineNode.attributes[i];
                    if (attrib.specified) {
                        newElement.setAttribute('data-'+attrib.name, attrib.value);
                    }
                }
                newElement.innerHTML = lineNode.innerHTML;
                lineNode.parentNode.replaceChild(newElement, lineNode);
        }
    };
    parser.xpath = function(el) {
        if (typeof el === 'string') {
            // document.evaluate(xpathExpression, contextNode, namespaceResolver, resultType, result );
            return document.evaluate(el, document, null, 0, null);
        }
        if (!el || el.nodeType !== 1) {
            return '';
        }

        var sames      = [].filter.call(el.parentNode.children, function (x) { return x.tagName === el.tagName; });
        var countIndex = sames.length > 1 ? ([].indexOf.call(sames, el)+1) : '';
        countIndex     = countIndex > 1 ? countIndex : '';
        var tagName    = el.tagName.toLowerCase() !== 'tei' ? '-'+el.tagName.toLowerCase() : '';
        return parser.xpath(el.parentNode) + tagName + countIndex;
    };

    parser.parsePages = function(doc, docId) {
        var currentDocument = angular.element(doc);
        angular.forEach(currentDocument.find(defPageElement), 
            function(element) {
                var newPage    = {};
                if (element.getAttribute('ed')) {
                    newPage.value  = element.getAttribute('xml:id') || element.getAttribute('ed').replace('#', '')+'-'+element.getAttribute('n') || 'page_'+(parsedData.getPages().length+1);
                } else {
                    newPage.value  = element.getAttribute('xml:id') || 'page_'+(parsedData.getPages().length+1);
                }
                newPage.label  = element.getAttribute('n')      || 'Page '+(parsedData.getPages().length+1);
                newPage.title  = element.getAttribute('n')      || 'Page '+(parsedData.getPages().length+1); 
                for (var i = 0; i < element.attributes.length; i++) {
                    var attrib = element.attributes[i];
                    if (attrib.specified) {
                        newPage[attrib.name] = attrib.value;
                    }
                }
                newPage.doc = docId;
                parsedData.addPage(newPage);
        });
        // console.log('## Pages ##', parsedData.getPages());
    };

    parser.parseDocuments = function(doc) {
        var currentDocument = angular.element(doc),
            defDocElement;
        if ( currentDocument.find('text').length > 0 ) {
            defDocElement = 'text';
        } else if ( currentDocument.find('div[subtype="edition_text"]').length > 0 ) {
            defDocElement = 'div[subtype="edition_text"]';
        }
        angular.forEach(currentDocument.find(defDocElement), 
            function(element) {
                var newDoc   = { 
                    value   : element.getAttribute('xml:id')  || parser.xpath(doc).substr(1) || 'doc_'+(parsedData.getDocuments().length+1),
                    label   : element.getAttribute('n')       || 'Doc '+(parsedData.getDocuments().length+1),
                    title   : element.getAttribute('n')       || 'Document '+(parsedData.getDocuments().length+1),
                    content : '<text>'+element.innerHTML+'</text>'
                };
                for (var i = 0; i < element.attributes.length; i++) {
                    var attrib = element.attributes[i];
                    if (attrib.specified) {
                        newDoc[attrib.name] = attrib.value;
                    }
                }
                parsedData.addDocument(newDoc);
                parser.parsePages(element, newDoc.value);
        });
        // console.log('## Documents ##', parsedData.getDocuments());
    };

    return parser;
});