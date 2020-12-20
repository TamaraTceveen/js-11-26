const API = 'https://raw.githubusercontent.com/GeekBrainsTutorial/online-store-api/master/responses';

const sendRequest = (path) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.timeout = 10000;

    xhr.ontimeout = () => {
      console.log('timeout!');
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          console.log('Error!', xhr.responseText);
          return reject('Error!', xhr.responseText);
        }
      }
    }

    xhr.open('GET', `${API}/${path}`);

    xhr.send();
  });
}

Vue.component('v-header', {
  template: `
    <header class="header center">
      <span class="logo">E-shop</span>
      
      <button @click="handleClick" type="button" class="cart-button">Корзина</button>
    </header>
  `,
  methods: {
    handleClick() {
      this.$emit('change-is-cart-visible');
    }
  }
});

Vue.component('v-search', {
  props: ['searchValue'],
  template: `
    <input type="text" 
    v-bind:value="searchValue"
    v-on:input="$emit('input', $event.target.value)" 
    class="search" placeholder="Search..." />
  `,
})

Vue.component('v-basket', {
  props: ['isCartVisible', 'cartGoods'],
  template: `
    <div v-if="isCartVisible" class="cart">
      <div class="cart-item" v-for="item in cartGoods">
        <p class="cart-item__title">{{item.product_name}}</p>
        <p>{{item.quantity}} x {{item.price}}</p>
      </div>
    </div>
  `,
})

Vue.component('v-goods', {
  props: ['goods'],
  template: `
  <main class="center">
    <section class="goods">
      <v-item
        v-for="item in goods"
        v-bind:element="item"
        v-on:addToBasket="handleAddToBasket"
      />
      <div v-if="!goods.length" class="goods-empty">
        Нет данных
      </div>
    </section>
  </main>
  `,
  methods: {
    handleAddToBasket(data) {
      this.$emit('add', data);
    },
  },
});

Vue.component('v-item', {
  props: ['element'],
  template: `
    <div class="item">
      <h4>{{element.product_name}}</h4>
      <p>{{element.price}}</p>
      <button type="button" v-on:click="addToBasket">Add to basket</button>
    </div>
  `,
  methods: {
    addToBasket() {
      this.$emit('addToBasket', this.element);
    }
  },
  
});

new Vue({
  el: '#app',
  data: {
    goods: [],
    basketGoods: [],
    searchValue: '',
    isVisible: false,
    findName:'',
  },
  mounted() {
    this.fetchData();
    this.fetchBasketData();
  },
  methods: {
    fetchData() {
      return new Promise((resolve, reject) => {
        sendRequest('catalogData.json')
          .then((data) => {
            this.goods = data;
            resolve();
          });
      });
    },
    fetchBasketData() {
      return new Promise((resolve, reject) => {
        sendRequest('getBasket.json')
          .then((data) => {
            this.basketGoods = data.contents;
            resolve();
          });
      });
    },
    addToBasket(item) {
      const index = this.basketGoods.findIndex((basketItem) => basketItem.id_product === item.id_product);
      if (index > -1) {
        this.basketGoods[index].quantity += 1;
      } else {
        this.basketGoods.push(item);
      }
      console.log(this.basketGoods);
      console.log(item);
    },
    removeItem(id) {
      this.basketGoods = this.basketGoods.filter((goodsItem) => goodsItem.id_product !== parseInt(id));
      console.log(this.id_product, this.basketGoods);
    },
  },
  computed: {
    filteredGoods() {
      console.log("awww");
      const regexp = new RegExp(this.searchValue.trim(), 'i');
      return this.goods.filter((goodsItem) => regexp.test(goodsItem.product_name));
    },
    totalPrice() {
      return this.goods.reduce((acc, curVal) => {
        return acc + curVal.price;
      }, 0);
    }
  }
})

/* class GoodsItem {
  constructor({ id_product, product_name, price }) {
    this.id = id_product;
    this.title = product_name;
    this.price = price;
  }

  render() {
    return `
      <div class="item" data-id="${this.id}">
        <h4>${this.title}</h4>
        <p>${this.price}</p>
        <button type="button" name="add-to-basket">Купить</button>
      </div>
    `;
  }
}

class GoodsList {
  constructor(basket) {
    this.goods = [];
    this.filteredGoods = [];
    this.basket = basket;

    document.querySelector('.goods').addEventListener('click', (event) => {
      if (event.target.name === 'add-to-basket') {
        const id = event.target.parentElement.dataset.id;
        const item = this.goods.find((goodsItem) => goodsItem.id_product === parseInt(id));
        if (item) {
          this.addToBasket(item);
        } else {
          console.error(`Can't find element with id ${id}`)
        }
      }
    });

    document.querySelector('.search').addEventListener('input', (event) => {
      this.search(event.target.value);
    });
  }

  fetchData() {
    return new Promise((resolve, reject) => {
      sendRequest('catalogData.json')
        .then((data) => {
          this.goods = data;
          this.filteredGoods = data;
          resolve();
        });
    });
  }

  newFetchData(callback) {
    fetch(`${API}/catalogData.json`)
      .then((response) => {
        console.log(response);
        return response.json();
      })
      .then((data) => {
        console.log(data);
        this.goods = data;
        callback();
      });
  }

  addToBasket(item) {
    this.basket.addItem(item);
  }

  getTotalPrice() {
    return this.goods.reduce((acc, curVal) => {
      return acc + curVal.price;
    }, 0);
  }

  render() {
    const goodsList = this.filteredGoods.map(item => {
      const goodsItem = new GoodsItem(item);
      return goodsItem.render();
    });
    document.querySelector('.goods').innerHTML = goodsList.join('');
  }

  search(value) {
    const regexp = new RegExp(value.trim(), 'i');
    this.filteredGoods = this.goods.filter((goodsItem) => regexp.test(goodsItem.product_name));
    this.render();
  }
}

class Basket {
  constructor() {
    this.basketGoods = [];
    this.amount = 0;
    this.countGoods = 0;
  }

  addItem(item) {
    const index = this.basketGoods.findIndex((basketItem) => basketItem.id_product === item.id_product);
    if (index > -1) {
      this.basketGoods[index].quantity += 1;
      // this.basketGoods[index] = { ...this.basketGoods[index], quantity: this.basketGoods[index].quantity + 1 };
    } else {
      this.basketGoods.push(item);
    }
    console.log(this.basketGoods);
  }

  removeItem(id) {
    this.basketGoods = this.basketGoods.filter((goodsItem) => goodsItem.id_product !== parseInt(id));
    console.log(this.basketGoods);
  }

  changeQuantity() {

  }

  clear() {

  }

  fetchData() {
    return new Promise((resolve, reject) => {
      sendRequest('getBasket.json')
        .then((data) => {
          this.basketGoods = data.contents;
          this.amount = data.amount;
          this.countGoods = data.countGoods;
          console.log(this);
          resolve();
        });
    });
  }

  applyPromoCode() {

  }

  getDeliveryPrice() {

  }

  createOrder() {

  }

  getTotalPrice() {

  }

  render() {

  }
}

class BasketItem {
  constructor({ title }) {
    this.title = title;
  }

  changeQuantity() {

  }

  removeItem() {
  }

  changeType() {
  }

  render() {

  }
}

const basket = new Basket();
basket.fetchData();
const goodsList = new GoodsList(basket);
goodsList.fetchData()
  .then(() => {
    goodsList.render();
    goodsList.getTotalPrice();
  }); */