
var searchTerm = null;

summaryInclude=60;
var fuseOptions = {
  shouldSort: true,
  includeMatches: true,
  threshold: 0.0,
  tokenize:true,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: [
    {name:"title",weight:0.8},
    {name:"contents",weight:0.5},
    {name:"tags",weight:0.3},
    {name:"categories",weight:0.3}
  ]
};

u('#searchTerm').on('change keyup', function() { // Set the search value on keyup for the input
    searchTerm = this.value;
})

function showAlert(message){
    u('#alert').removeClass("is-hidden")
    u('#alert').html(message)
    setTimeout(function () {
        u('#alert').addClass("is-hidden")
    }, 3000)
}

u('#searchButton').handle('click', function(e) { //use handle to automatically prevent default
    if(searchTerm){
        u("#searchTerm").text(searchTerm);
        u('#searchButton').addClass("is-loading");
        executeSearch(searchTerm);
      }else {
        showAlert("Search cannot be empty!")
      }
})

function executeSearch(searchQuery){
    fetch("/index.json").then(r => r.json())
    .then(function(data) {    
        var pages = data;
        var fuse = new Fuse(pages, fuseOptions);
        var result = fuse.search(searchQuery);
        if(result.length > 0){
            u('#content').addClass("is-hidden"); //hiding our main content to display the results
            u('#searchResults').children(u('div')).empty(); // clean out any previous search results
            u('#searchButton').removeClass("is-loading") //change our button back
            u('#searchResults').removeClass("is-hidden") //show Result area
            populateResults(result);
        }else{
          showAlert("No results found!")
          u('#searchButton').removeClass("is-loading");
          u("#searchTerm").text("");
        }
    });
}

function populateResults(result){
    //Object.keys(result).forEach(function(key,value){
    Object.entries(result).forEach(entry => {
        const [key, value] = entry;
        var contents= value.item.contents;
        var snippet = "";
        var snippetHighlights=[];
        var tags =[];
        if( fuseOptions.tokenize ){
          snippetHighlights.push(searchTerm);
        }else{
          value.matches.forEach(function(matchKey,mvalue){
            
            if(mvalue.key == "tags" || mvalue.key == "categories" ){
              snippetHighlights.push(mvalue.value);
            }else if(mvalue.key == "contents"){
              start = mvalue.indices[0][0]-summaryInclude>0?mvalue.indices[0][0]-summaryInclude:0;
              end = mvalue.indices[0][1]+summaryInclude<contents.length?mvalue.indices[0][1]+summaryInclude:contents.length;
              snippet += contents.substring(start,end);
              snippetHighlights.push(mvalue.value.substring(mvalue.indices[0][0],mvalue.indices[0][1]-mvalue.indices[0][0]+1));
            }
          });
        }

        if(snippet.length<1){
            snippet += contents.substring(0,summaryInclude*2);
          }
          //pull template from hugo template definition
          var templateDefinition = u('#search-result-template').html();
          //replace values
          var output = render(templateDefinition,{key:key,title:value.item.title,link:value.item.permalink,tags:value.item.tags,categories:value.item.categories,snippet:snippet,image:value.item.imageLink});
          u('#searchResultsCol').append(output);
    })
}

  
  function param(name) {
      return decodeURIComponent((location.search.split(name + '=')[1] || '').split('&')[0]).replace(/\+/g, ' ');
  }
  
function render(templateString, data) {
    var conditionalMatches,conditionalPattern,copy;
    conditionalPattern = /\$\{\s*isset ([a-zA-Z]*) \s*\}(.*)\$\{\s*end\s*}/g;
    //since loop below depends on re.lastInxdex, we use a copy to capture any manipulations whilst inside the loop
    copy = templateString;
    while ((conditionalMatches = conditionalPattern.exec(templateString)) !== null) {
      if(data[conditionalMatches[1]]){
        //valid key, remove conditionals, leave contents.
        copy = copy.replace(conditionalMatches[0],conditionalMatches[2]);
      }else{
        //not valid, remove entire section
        copy = copy.replace(conditionalMatches[0],'');
      }
    }
    templateString = copy;
    //now any conditionals removed we can do simple substitution
    var key, find, re;
    for (key in data) {
      find = '\\$\\{\\s*' + key + '\\s*\\}';
      re = new RegExp(find, 'g');
      templateString = templateString.replace(re, data[key]);
    }
    return templateString;
}

function formatAmount(amount) {
    if (amount === null || isNaN(amount)) {
        return "";
    }
    var rounded = Math.round(amount * 100) / 100;
    var text = rounded.toString();
    return text.replace(/\.?0+$/, "");
}

function toMixedFraction(amount) {
    var tolerance = 0.02;
    var rounded = Math.round(amount * 10000) / 10000;
    var whole = Math.floor(rounded + 1e-9);
    var frac = rounded - whole;
    if (frac < tolerance) {
        return whole.toString();
    }

    var denominators = [2, 3, 4, 8];
    var best = null;
    denominators.forEach(function (den) {
        var num = Math.round(frac * den);
        if (num === 0) {
            return;
        }
        var candidate = num / den;
        var diff = Math.abs(candidate - frac);
        if (diff <= tolerance && (!best || diff < best.diff)) {
            best = { num: num, den: den, diff: diff };
        }
    });

    if (!best) {
        return "";
    }

    var num = best.num;
    var den = best.den;
    if (num === den) {
        whole += 1;
        num = 0;
    }

    if (num === 0) {
        return whole.toString();
    }
    if (whole > 0) {
        return whole + " " + num + "/" + den;
    }
    return num + "/" + den;
}

function pluralizeUnit(unit, unitPlural, amount) {
    if (!unit) {
        return "";
    }
    if (unit === "g" || unit === "tsp" || unit === "tbsp") {
        return unit;
    }
    if (amount === 1) {
        return unit;
    }
    if (unitPlural) {
        return unitPlural;
    }
    if (unit.endsWith("s")) {
        return unit;
    }
    return unit + "s";
}

document.addEventListener("DOMContentLoaded", function () {
    var servingsWrap = document.querySelector(".recipe-servings");
    if (!servingsWrap) {
        return;
    }

    var input = servingsWrap.querySelector("#servingsInput");
    var baseServings = parseFloat(servingsWrap.getAttribute("data-base-servings"));
    if (!input || isNaN(baseServings) || baseServings <= 0) {
        return;
    }

    function updateServings() {
        var desiredServings = parseFloat(input.value);
        if (isNaN(desiredServings) || desiredServings <= 0) {
            return;
        }

        var scale = desiredServings / baseServings;
        var amounts = document.querySelectorAll(".recipe-ingredient-amount");
        amounts.forEach(function (amountNode) {
            var parent = amountNode.closest(".recipe-ingredient");
            if (parent && parent.getAttribute("data-scalable") === "false") {
                return;
            }

            var baseAmount = parseFloat(amountNode.getAttribute("data-base-amount"));
            if (isNaN(baseAmount)) {
                return;
            }

            var unit = amountNode.getAttribute("data-base-unit") || "";
            var unitPlural = amountNode.getAttribute("data-base-unit-plural") || "";
            var scaledAmount = baseAmount * scale;
            var displayUnit = unit ? pluralizeUnit(unit, unitPlural, scaledAmount) : "";
            var fractionAmount = toMixedFraction(scaledAmount);
            var displayAmount = fractionAmount ? fractionAmount : formatAmount(scaledAmount);
            amountNode.textContent = displayUnit ? displayAmount + " " + displayUnit : displayAmount;
        });
    }

    updateServings();
    input.addEventListener("input", updateServings);
    input.addEventListener("change", updateServings);
});
