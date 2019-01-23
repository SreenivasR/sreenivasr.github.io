var request;
var lunrIndex;

var allProducts = [];
var allBrands = [];
var allCatergories = [];
var productsInCart = [];

var filteredProducts = [];
var filteredBrandOptions = [];
var filteredCatergoryOptions = [];

var sorterOptions = ["Name", "Lowest Price", "Highest Price"];

var page = 0;
var itemsAtPage = 10;

loadDataFromFile();

function getCartItemTemplate(product){
  return ` <div class="uk-card uk-card-default" id="cartItem${product.sku}">
      <div class="uk-card-header">
          <div class="uk-grid-small uk-flex-middle" uk-grid>
              <div class="uk-width-auto">
                  <img class="uk-border-circle" width="40" height="40" src=${product.image}>
              </div>
              <div class="uk-width-expand">
                  <h3 class="uk-card-title uk-margin-remove-bottom e-cart-modal-card">${product.name}</h3>
              </div>
              <div class="uk-width-auto" onclick="addToCart(${product.sku})">
                  <span uk-icon="icon: trash" class="e-cart"></span>
              </div>
          </div>
      </div>
  </div>`
}

function getProductItemTemplate(product){

  const cartBtnConfig = {
    text : "Add to cart",
    class: "uk-button-primary"
  }
  if(productsInCart.indexOf(product.sku) > -1){
    cartBtnConfig.text = "Remove";
    cartBtnConfig.class = "uk-button-danger"
  }

  return ` <div class="e-auto-width" id=${product.sku}>
    <div class="uk-card uk-card-default uk-grid-collapse uk-child-width-1-3@m uk-margin"  uk-grid>
        <div class="uk-card-media-left uk-cover-container uk-light uk-background-secondary uk-padding">
            <img src=${product.image} uk-cover class="e-card-img">
            <canvas width="150" height="200"></canvas>
        </div>
        <div class="uk-dark uk-background-muted uk-padding">
            <div class="uk-card-body">
                <h3 class="uk-card-title e-card-title">${product.name}</h3>
                <p class="e-card-desc">${product.description}</p>
            </div>
        </div>
        <div>
            <div class="uk-card-body e-card-body">
                <h3 class="uk-card-title">${product.manufacturer}</h3>
                <p>${product.model}</p>
                <p>$ ${product.price}</p>
                <button class="uk-button uk-button-primary ${cartBtnConfig.class}" id="cartBtn${product.sku}" onclick="addToCart(${product.sku})">${cartBtnConfig.text}</button>
            </div>
        </div>
      </div>
    </div>`
}

function getCategoryFilterItem(each){
  return '<input class="uk-checkbox" type="checkbox" onchange="filterByCategory(this);" value="' + each + '"> <label for="+each+"> &nbsp;'+ each +'</label>'
}

function getBrandFilterItem(each){
  return '<input class="uk-checkbox" type="checkbox" onchange="filterByBrand(this);" value="' + each + '"> <label for="+each+"> &nbsp;'+ each +'</label>';
}

// Load next page of products when bottom of the page is reached
window.onscroll = function(ev) {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
    getPaginatedResult();
  }
};

// HTTP GET call to fetch product data
function loadDataFromFile() {
  var url = "products.json";
  if (window.XMLHttpRequest) {
    request = new XMLHttpRequest();
  } else if (window.ActiveXObject) {
    request = new ActiveXObject("Microsoft.XMLHTTP");
  }
  try {
    request.onreadystatechange = processResponse;
    request.open("GET", url, true);
    request.send();
  } catch (e) {
    alert("Unable to fetch data...");
  }
}

// callback to parse HTTP response
function processResponse() {
  if (request.readyState == 4) {
    allProducts = JSON.parse(request.responseText);
    initLunrSearchIndex();
    addFilterMenu();
    setTimeout(function(){
      getPaginatedResult();
    }, 1500)
   
  }
}

// Full Text search indexing : https://lunrjs.com
function initLunrSearchIndex(){
  lunrIndex = lunr(function () {
    this.ref('sku')
    this.field('name')
    this.field('description')
    this.field('model')
    allProducts.forEach(function (doc) {
      this.add(doc)
    }, this)
  });
}

function search($evt){
  let val = $evt.value;
  if(!val.trim()) {
    filteredProducts = [...allProducts];
    addPage(page, filteredProducts, true);
    return;
  };
  if(!lunrIndex) { console.warn("Lunr index not yet build"); return; }
  let res = lunrIndex.search( val + "*" );
  filteredProducts = [];
  page = 0;
  res.forEach(function(each){
    let item = allProducts.find(el => el.sku == each.ref);
    filteredProducts.push(item);
  });
  addPage(page, filteredProducts, true);
}

function addFilterMenu(){

  let parentNode = document.getElementById('filterByBrands');
  let mParentNode = document.getElementById('mFilterByBrands');
  
  let cParentNode = document.getElementById('filterByCategories');
  let mcParentNode = document.getElementById('mFilterByCategories');

  allBrands = allProducts.map(function(each, i){
    return each.manufacturer;
  });

  allBrands = [...new Set(allBrands)];
  
  allBrands.forEach(function(each){
    let option = document.createElement('li');
    option.innerHTML =  getBrandFilterItem(each);
    parentNode.appendChild(option);
    mParentNode.appendChild(option.cloneNode(true));
  });

  allCatergories = allProducts.map(function(each, i){
    return  allCatergories.concat(each.category);
  }).reduce(function(pre, cur) {
    return pre.concat(cur[0]);
  });

  allCatergories = [...new Set(allCatergories)];

  allCatergories.forEach(function(each){
    let option = document.createElement('li');
    option.innerHTML =  getCategoryFilterItem(each);
    cParentNode.appendChild(option);
    mcParentNode.appendChild(option.cloneNode(true));
  });

  addSorterMenu()
}

function addSorterMenu(){
  let select = document.getElementById("sortOptions");
  sorterOptions.forEach(function(each){
    let option = document.createElement('option');
    option.value = each;
    option.text = each;
    select.add(option);
  })
}

function filterByBrand($evt){
  if($evt.checked) filteredBrandOptions.push($evt.value)
  if(!$evt.checked) filteredBrandOptions.splice(filteredBrandOptions.indexOf($evt.value), 1);
  filterStore('manufacturer');
}

function filterByCategory($evt){
  if($evt.checked) filteredCatergoryOptions.push($evt.value)
  if(!$evt.checked) filteredCatergoryOptions.splice(filteredCatergoryOptions.indexOf($evt.value), 1);
  filterStore('category');
}

function filterStore(option){
  page = 0;
  if(option === 'manufacturer'){
    filteredProducts = allProducts.filter(function(elem, index, self) {
      return filteredBrandOptions.indexOf(elem.manufacturer) > -1;
    });
  }else{
    filteredProducts = allProducts.filter(function(elem, index, self) {
      let found = elem.category.filter(function(obj) {
          return filteredCatergoryOptions.indexOf(obj) > -1; 
      });
      if(found.length > 0) return true
    });
  }
  if(filteredBrandOptions.length == 0 && filteredCatergoryOptions.length == 0)
    addPage(page, allProducts, true);
  else
    addPage(page, filteredProducts, true);
}

function sort(field){
  let products = filteredBrandOptions.length == 0 && filteredCatergoryOptions.length == 0 ? allProducts : filteredProducts;
  var option = field.value;
  if(option.toLowerCase() == "name"){
    products = products.sort(function (a, b) {
      var x = a["name"]; var y = b["name"];
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  }else if(option.toLowerCase().indexOf('lowest') > -1){
    products = products.sort(function (a, b) {
      return a.price - b.price;
    });
  }else if(option.toLowerCase().indexOf('highest') > -1){
    products = products.sort(function (a, b) {
      return b.price - a.price;
    });
  }
  page = 0;
  addPage(page, products, true);
}

function addToCart(sku){
  var idx = productsInCart.indexOf(sku);
  if(idx == -1) productsInCart.push(sku);
  else productsInCart.splice(idx, 1);
  refreshCart(sku);
}

// Toggle to add / remove product, if product doesn't exist (or) exists respectively
function refreshCart(sku){

  let cart = document.getElementById("cartModal");
  let cartItem = document.getElementById("cartItem"+sku);
  let cartBtn = document.getElementById("cartBtn"+sku);

  if(cartItem){
    cartItem.remove();
    cartBtn.classList.remove("uk-button-danger");
    cartBtn.innerHTML = "Add to Cart"
    return;
  }
  
  let product = allProducts.find(el => el.sku == sku);
  let productNode = document.createElement("div");

  const markup = getCartItemTemplate(product);
  
  productNode.innerHTML = markup;
  cartBtn.classList.add("uk-button-danger");
  cartBtn.innerHTML = "Remove"
  cart.append(productNode)
}

// loads one page dynamically with offset param
function getPaginatedResult() {
    
    let products = filteredBrandOptions.length == 0 && filteredCatergoryOptions.length == 0 ? allProducts : filteredProducts;
    let startIndex = page * itemsAtPage;
    let endIndex = startIndex + itemsAtPage;
    if ( startIndex > products.length ) return;
    if ( endIndex > products.length ) endIndex = products.length - 1;
    
    let res = products.slice( startIndex , endIndex );
    addPage(page, res, startIndex==0);
    page ++;
}

// Adds a new page
function addPage(index, res, clear=false) {
  const markup = ` <div uk-grid uk-scrollspy="target: > div; cls:uk-animation-fade; delay: 50">
    ${res
      .map(
        each => getProductItemTemplate(each)
      )
      .join("")}
    </div>`;
  
  // Adding new page
  let page = document.createElement("div");
  page.id = "page"+index;
  page.innerHTML = markup;

  // Appending to product list
  let element = document.getElementById("productList");
  if(clear) element.innerHTML = '';
  element.append(page);
  
  // if(clear) setTimeout(function(){window.scrollTo(0, 0);}, 800);
  
}