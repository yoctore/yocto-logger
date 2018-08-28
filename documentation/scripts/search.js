// only if document is ready ?
$(document).ready(function () {
  // append content on navbar first
  $('.reference-title').parent().append(
    '<div class="logo-nav"><a href="http://www.yocto.re" target="_blank"><img class="logo" src="./extras/logo-yocto.png" alt="logo-yocto"></a></div>'
  );

  // force remove of search container on dom is already exists
  $('.search-container').remove();

  // appene search on navbar
  $('.top-nav-wrapper > ul').append(
    '<li class="search-container"><input class="search" placeholder="Type your search here ...."/></li>'
  );

  // chack all 
  $('.blank').each(function() {
    $(this).click(function() {
      // open in blank page
      window.open($(this).attr('href'), '_blank');
      // default statement
      return false;      
    })
  })

  // parse all parent
  $('nav > ul > li').each(function () {
    $(this).addClass('parent');
  });
  // parse all child
  $('nav > ul > li > ul > li').each(function () {
    $(this).addClass('child');
  });

  // custom search
  $('.search').keyup(function() {
    var value = $(this).val();
    // if input is empty clean previous process
    if (value === '') {
      $('.thide, .parent, .child').each(function () {
        $(this).show().removeClass('.thide');
      })
    }
    $('.child').each(function() {
      // get value
      var childValue = $(this).children().text();
      // value is include 
      if (!_.includes(_.trim(childValue).toLowerCase(), _.trim(value).toLowerCase())) {
        $(this).addClass('thide').hide();
        // parse all parent
        $('.parent').each(function() {
          // mapping
          if ($(this).find('.thide').length === $(this).find('.child').length) {
            $(this).hide();
          }
        });
      } else {
        $(this).show().removeClass('thide');
        // parse all parent
        $('.parent').each(function() {
          // mapping
          if ($(this).find('.thide').length !== $(this).find('.child').length) {
            $(this).show();
          }
        });
      }
    });
  });
});
