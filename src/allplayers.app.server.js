var allplayers = allplayers || {app: {}};

(function(window, document, allplayers, $, undefined) {
  if ($ && !$.fn.allplayers_server) {

    /**
     * Define the jQuery plugin.
     *
     * @param {object} options The options for this plugin.
     * @return {object} A jQuery object.
     * @this The jQuery context for each element.
     **/
    $.fn.allplayers_server = function(options) {
      return $(this).each(function() {
        new allplayers.app.server(options, $(this));
      });
    };
  }

  /**
   * The allplayers app server.
   *
   * @param {object} options The options for this app server.
   * @param {object} context The display context for this plugin.
   * @this The allplayers.app.server.
   */
  allplayers.app.server = function(options, context) {

    // Store the context.
    this.context = context;

    // Call the allplayers.app constructor.
    allplayers.app.call(this, options, {
      spinner: '',
      loading: 'Loading',
      base: 'https://platform.allplayers.com',
      type: 'registration',
      group: 'api',
      query: {},
      reg: {},
      checkout: {},
      src: '',
      style: '',
      complete: function() {}
    });
  };

  /** Derive from allplayers.app. */
  allplayers.app.server.prototype = new allplayers.app();

  /** Reset the constructor. */
  allplayers.app.server.prototype.constructor = allplayers.app.server;

  /**
   * Initialize the allplayer app library.
   */
  allplayers.app.server.prototype.init = function() {

    // Call the parent.
    allplayers.app.prototype.init.call(this);

    // Get the base URL of the embed page.
    this.baseURL = 'https://platform.allplayers.com';
    if (this.options.base) {
      this.baseURL = this.options.base;
    }

    // Set the spinner if it isn't set.
    if (!this.options.spinner) {
      this.options.spinner = this.options.base;
      this.options.spinner += '/sites/all/themes/basic_foundation';
      this.options.spinner += '/images/loader.gif';
    }

    // Add the iframe.
    var iframeId = this.context.attr('id') + '_iframe';

    // Get the source for the iframe.
    var source = '';

    // See if they provide their own query.
    var q = $.SeamlessBase.getParam('apq');
    if (q) {
      source = this.options.base + '/' + q;
    }
    else if (this.options.src) {
      source = this.options.src;
    }
    else {
      source = this.options.base + '/g/' + this.options.group;
      switch (this.options.type) {
        case 'registration':
          source += '/register';
          break;
        case 'forms':
          source += '/forms';
          break;
      }

      // Add the type as a query parameter.
      this.options.query.etyp = this.options.type;
    }

    // Add the app source to the url.
    source += (source.search(/\?/) === -1) ? '?' : '&';

    // If they have some query options then add them here.
    if (!$.SeamlessBase.isEmptyObject(this.options.query)) {
      for (var param in this.options.query) {
        source += param + '=' + encodeURIComponent(this.options.query[param]);
        source += '&';
      }
    }

    // Add the ehost to the source.
    source += 'ehost=' + allplayers.base64.encode(window.location.origin);

    // Get the iframe object.
    var self = this;
    var iframe = $(document.createElement('iframe')).attr({
      id: iframeId,
      name: iframeId,
      src: source
    });

    // Add the iframe.
    this.context.append(iframe);

    // Make the iframe seamless.
    iframe = iframe.seamless({
      spinner: this.options.spinner,
      styles: this.options.style,
      onConnect: function(data) {
        if (self.options.type == 'registration') {
          // Send them the registration object.
          iframe.send({
            type: 'getRegistration',
            data: self.options.reg
          });
        }
        else if (self.options.type == 'checkout') {
          // Send them the checkout object.
          iframe.send({
            type: 'getCheckout',
            data: self.options.checkout
          });
        }
      }
    });

    /**
     * Method to ensure that an added product is valid.
     *
     * @param {object} product
     *   The product to be added to the registration.
     *
     * @return {boolean}
     *   If this product is a valid product.
     */
    var productValid = function(product) {
      return product.product_uuid &&
        product.price &&
        product.quantity &&
        product.title;
    };

    /**
     * Returns the product input.
     *
     * @param {string} uuid
     *   The uuid for the product input.
     *
     * @return {object}
     *   The jQuery object of the product input.
     */
    var productInput = function(uuid) {
      return $('input[product="' + uuid + '"]');
    };

    /**
     * Returns the product with an updated total.
     *
     * @param {object} product
     *   The product object.
     *
     * @return {object}
     *   The updated product object.
     */
    var productUpdateTotal = function(product) {
      // Add raw price if not already there.
      if (!product.price_raw) {
        product.price_raw = accounting.unformat(product.price) * 100;
      }

      // Format the price.
      product.price = accounting.formatMoney(product.price);

      // Calculate the total price.
      product.total = accounting.formatMoney(
        product.price_raw * product.quantity / 100
      );

      return product;
    };

    /**
     * Add a product to the list of products.
     *
     * @param {array} products
     *   The array of already added products.
     * @param {object} product
     *   The product to add.
     *
     * @return {array}
     *   The updated list of products.
     */
    var addCheckoutProducts = function(products, product) {
      // Add the product info to the list of adhoc products to create.
      var newProduct = true;
      if (products) {
        products = JSON.parse(products);
        // Check if the adhoc product has already been added.
        for (var i = 0; i < products.length; i++) {
          if (
            products[i].title == product.title &&
            products[i].price_raw == product.price_raw
          ) {
            // The product was found so increase the quantity and total price.
            newProduct = false;
            products[i].quantity += product.quantity;
            products[i].total = accounting.formatMoney(
              products[i].price_raw * products[i].quantity /
              100
            );
            product = products[i];
            break;
          }
        }
      }
      else {
        products = [];
      }

      // If a new adhoc product, add it to the list.
      if (newProduct) {
        products.push(product);
      }
      addCheckoutProductInfo(product);

      return products;
    };

    /**
     * Process a checkout.
     *
     * @param {object} checkout
     *   The checkout object.
     * @param {array} adhocProducts
     *   Array of adhoc products.
     * @param {array} existingProducts
     *   Array of existing products.
     * @param {string} src
     *   The source.
     */
    allplayers.app.server.prototype.init.processCheckout = function(
      checkout,
      adhocProducts,
      existingProducts,
      src
    ) {

      // Calculate the order total with the added adhoc/existing products.
      var orderTotal = checkout.commerce_order_total.und[0].amount;
      for (var i = 0; i < adhocProducts.length; i++) {
        orderTotal += adhocProducts[i].price_raw;
      }
      for (i = 0; i < existingProducts.length; i++) {
        orderTotal += existingProducts[i].price_raw;
      }

      // Determine how much the user paid.
      var paid = orderTotal;
      var partialPayment = '#edit-commerce-payment-payment-details-amount';
      if ($(partialPayment)) {
        paid = parseFloat($(partialPayment).val()) * 100;
      }

      // Tell the client to process the checkout.
      iframe.send({
        type: 'processCheckout',
        data: {
          checkout: checkout,
          adhocProducts: adhocProducts,
          existingProducts: existingProducts,
          orderTotal: orderTotal,
          paid: paid
        }
      });
    };

    /**
     * Method to add the checkout product info to the table on the page.
     *
     * @param {object} product
     *   The product to be added.
     */
    var addCheckoutProductInfo = function(product) {
      var newProduct = true;

      // Check if the product is existing or adhoc.
      if (product.product_uuid) {
        // If the product is already listed in the table, update the quantity
        // and total.
        if ($('tr#adhoc-product-' + product.product_uuid).length > 0) {
          $('tr#adhoc-product-' + product.product_uuid + ' .quantity')
            .text(product.quantity);
          $('tr#adhoc-product-' + product.product_uuid + ' .total')
            .text(product.total);
          newProduct = false;
        }
      }
      else {
        // Check if the product is already in the table.
        $('.views-table tbody tr').each(function() {
          var title = $(this).find('.title').text();
          var price = $(this).find('.price').text();
          if (
            title &&
            price &&
            title.indexOf(product.title) !== -1 &&
            price.indexOf(product.price) !== -1
          ) {
            // Update quantity and total and exit the each loop.
            $(this).find('.quantity').text(product.quantity);
            $(this).find('.total').text(product.total);
            newProduct = false;
            return false;
          }
        });
      }

      // Add the product to the table if it's a new product.
      if (newProduct) {
        $('.views-table tbody').append(
          '<tr id="adhoc-product-' + product.product_uuid + '">' +
            '<td class="title">' + product.title + '</td>' +
            '<td class="seller"></td>' +
            '<td class="price">' + product.price + '</td>' +
            '<td class="quantity">' + product.quantity + '</td>' +
            '<td class="total">' + product.total + '</td>' +
          '</tr>'
        );
      }

      // Update the order total.
      var componentTotal = $('td.component-total');
      var total = componentTotal.text();
      total = accounting.unformat(total) + (product.price_raw / 100);
      total = accounting.formatMoney(total);
      componentTotal.text(total);
    };

    /**
     * Set the next button text.
     *
     * @param string text
     *   The next button text to set.
     */
    var setNextText = function(text) {
      $('.actions-wrapper').show();
      $('#edit-next-text').val(text);
      $('.next-button input').val(text);
    };

    // Give them the ability to change the next button.
    iframe.receive('setNext', function(data) {
      if (data) {
        if (data.text) {
          setNextText(data.text);
        }
        else {
          $('.actions-wrapper').hide();
        }
      }
    });

    // Get the totals added to the cart.
    var getTotals = function() {
      var quantity = 0;
      var total = 0;
      $('input[name="add-product[]"]').each(function() {
        var product = JSON.parse($(this).attr('value'));
        var productQuantity = parseInt(product.quantity, 10);
        var productPrice = parseInt(product.price_raw, 10);
        quantity += productQuantity;
        total += (productPrice * productQuantity);
      });

      // Return the results.
      return {
        quantity: quantity,
        total: parseFloat(total / 100).toFixed(2)
      };
    };

    // Ensure we have a products table present.
    var ensureProductsTable = function() {
      if ($('#add-products-table').length === 0) {
        $('<table>').attr({
          id: 'add-products-table',
          class: 'sticky-table'
        }).appendTo('#add-products');

        // Create the products table.
        $('#add-products-table').append(
          '<thead>' +
            '<tr>' +
              '<th>Added Products</th>' +
              '<th>Price</th>' +
              '<th>Quantity</th>' +
              '<th></th>' +
            '</tr>' +
          '</thead>' +
          '<tbody></tbody>' +
          '<tfoot>' +
            '<tr>' +
              '<td style="text-align: right;">Total:</td>' +
              '<td id="price-total"></td>' +
              '<td id="quantity-total"></td>' +
              '<td>&nbsp;</td>' +
            '</tr>' +
          '</tfoot>'
        );
      }
    };

    // Add a new product.
    var addProduct = function(product) {

      // Create the input for the new product.
      $('<input>').attr({
        type: 'hidden',
        product: product.hasOwnProperty('product_uuid') ? product.product_uuid : '',
        name: 'add-product[]',
        value: JSON.stringify(product)
      }).appendTo('form#og-registration-register-app');

      // Make sure this is a visible product being added.
      if (!product.hidden) {

        // Change the next button value.
        setNextText(product.next ? product.next : 'Continue');

        // Add the products table if not already.
        ensureProductsTable();

        var disabledText = '';
        if (product.readonly) {
          disabledText = 'disabled';
        }

        // Create the row.
        var row = $(document.createElement('tr'));
        row.append(
          '<td>' + product.title + '</td>' +
          '<td>' + product.price + '</td>' +
          '<td><input type="text" class="product-quantity" value="' + product.quantity + '" ' + disabledText + '></td>'
        );

        // Add an attribute and remove button if this is not an ad-hoc product.
        if (product.hasOwnProperty('product_uuid')) {
          row.attr('id', 'add-product-display-' + product.product_uuid).append(
            '<td><input type="button" class="remove-product text-button" value="Remove" /></td>'
          );
        }

        // Add the product to the table.
        $('#add-products-table tbody').append(row);
      }
    };

    // Update the totals.
    var updateTotals = function() {
      var totals = getTotals();
      $('#price-total').text('$' + totals.total);
      $('#quantity-total').text(totals.quantity);
    };

    // Called to show an error to the user.
    var showError = function() {

      // Don't show the loader.
      setLoading(false);

      // Show an error.
      $('#add-products').prepend($(document.createElement('div')).attr({
        'class': 'alert-box alert'
      }).append('There was an error adding your products.  Please try again later'));
    };

    var loadingTimer = 0;

    // Called to show a loader for the products.
    var setLoading = function(loading) {

      // Clear the loader.
      clearTimeout(loadingTimer);

      // Remove previous loaders.
      $('#add-products .products-loading').remove();

      // If we are loading, then let them know.
      if (loading) {

        // Create our loader elemenet.
        var loader = $(document.createElement('div')).attr({
          'class': 'alert-box products-loading'
        }).append(
          $(document.createElement('div')).css({
            background: 'url(/sites/all/libraries/allplayers.js/lib/seamless.js/src/loader.gif) no-repeat 10px 32px',
            padding: '10px 10px 10px 70px',
            width: '100%'
          }).append('<h4>Adding products to cart...</h4>')
        );

        // Prepend our loader to the products section.
        $('#add-products').prepend(loader);

        // Make sure they don't wait to long.
        loadingTimer = setTimeout(function() {
          showError();
        }, 20000);
      }
    };

    // The addProduct action.
    iframe.receive('addProduct', function(data) {

      // If the product is existing.
      if (data && data.product_uuid) {

        // Say we are loading.
        setLoading(true);

        try {
          var errorText = '';

          // Retrieve the product.
          (new allplayers.product({uuid: data.product_uuid})).getProduct(
            data.product_uuid,
            function(result) {

              // Check if the UUIDs match.
              if (result.uuid == data.product_uuid) {
                var uuid = data.product_uuid;
                var product = productInput(uuid).val();
                data.title = result.title;

                // If a product was already found.
                if (product) {

                  // Update the quantity.
                  product = JSON.parse(product);
                  product.quantity = parseInt(product.quantity);
                  product.quantity += parseInt(data.quantity);
                  productInput(uuid).val(JSON.stringify(product));
                  var productCol = '#add-product-display-' + uuid;
                  $(productCol + ' input.product-quantity').val(product.quantity);
                }

                // Make sure the product is valid.
                else if (productValid(data)) {

                  // If it is a product with a value greater than $0, or price
                  // isn't supplied, use the price  assigned to the product in
                  // store.
                  if (
                    data.price == 'undefined' ||
                    (result.type == 'product' && result.price_raw > 0)
                  ) {
                    data.price = result.price_raw / 100;
                  }
                  data = productUpdateTotal(data);
                  addProduct(data);
                }

                // Update the totals.
                updateTotals();

                // Say we are no longer loading.
                setLoading(false);
              }
              else {

                // Show an error.
                showError();
              }
            }
          );
        }
        catch (err) {

          // Show an error.
          showError();
        }
      }
      // The product is an adhoc product.
      else {
        // Update the product total price.
        data = productUpdateTotal(data);
        data.title += ' (Adhoc)';
        addProduct(data);
        updateTotals();
      }
    });

    // The addCheckoutProduct action.
    iframe.receive('addCheckoutProduct', function(data) {

      // If the product is existing.
      if (data && data.product_uuid) {
        (new allplayers.product({uuid: data.product_uuid})).getProduct(
          data.product_uuid,
          function(result) {
            // Check if the UUIDs match.
            if (result && result.uuid == data.product_uuid) {
              // The product exists.
              var uuid = data.product_uuid;
              var product = productInput(uuid).val();
              var existingProducts = $('#add-existing-products-' +
                self.options.checkout.order_id).val();

              // If a product was already found.
              if (product) {

                // Update the quantity.
                product = JSON.parse(product);
                product.quantity = parseInt(product.quantity);
                product.quantity += parseInt(data.quantity);
                productInput(uuid).val(JSON.stringify(product));
                var productCol = '#adhoc-product-' + uuid;
                $(productCol + ' td.quantity').text(product.quantity);
              }

              // Make sure the product is valid.
              else if (productValid(data)) {

                // If it is a product with a value greater than $0, or price
                // isn't supplied, use the price  assigned to the product in
                // store.
                if (
                  data.price == 'undefined' ||
                  (result.type == 'product' && result.price_raw > 0)
                ) {
                  data.price = result.price_raw / 100;
                  data.price_raw = result.price_raw;
                }
                data.title = result.title;
                data = productUpdateTotal(data);
              }
              existingProducts = addCheckoutProducts(existingProducts, data);
              $('#add-existing-products-' + self.options.checkout.order_id)
                .val(JSON.stringify(existingProducts));
            }
            else {
              alert('There was an error adding the product.');
            }
          }
        );
      }
      // The product is an adhoc product.
      else {
        // Update the product total price.
        data = productUpdateTotal(data);
        data.title += ' (Adhoc)';

        // Add the product info to the list of adhoc products to create.
        var adhocProducts = $('#add-adhoc-products-' +
          self.options.checkout.order_id).val();
        adhocProducts = addCheckoutProducts(adhocProducts, data);

        $('#add-adhoc-products-' + self.options.checkout.order_id)
          .val(JSON.stringify(adhocProducts));
      }
    });

    // The remove product message.
    iframe.receive('removeProduct', function(data) {
      var uuid = data.product_uuid;
      removeProduct(uuid);
    });
    
    $('#add-products-table input.product-quantity').live('change', function() {
      var uuid = $(this).parent().parent().attr('id').replace('add-product-display-', '');
      var product = JSON.parse(productInput(uuid).val());
      var quantity = $(this).val();
      if (quantity != product.quantity) {
        if (!isNaN(quantity)) {
          product.quantity = parseInt(quantity);
          product = productUpdateTotal(product);
          productInput(uuid).val(JSON.stringify(product));
          if (product.quantity != quantity) {
            $(this).val(product.quantity);
          }
        }
        else {
          $(this).val(product.quantity);
        }
      }
    });
    
    $('#add-products-table input.remove-product').live('click', function(e) {
      e.preventDefault();
      var uuid = $(this).parent().parent().attr('id').replace('add-product-display-', '');
      removeProduct(uuid);
    });
    
    function removeProduct(uuid) {
      var product = productInput(uuid).val();
      if (product) {
        // Remove the input and table field.
        productInput(uuid).remove();
        $('#add-product-display-' + uuid).remove();

        // Let the child page know.
        iframe.send({
          type: 'removeProduct',
          data: JSON.parse(product)
        });

        // Update the totals.
        updateTotals();
      }
    }
  };
}(window, document, window.allplayers, jQuery));
