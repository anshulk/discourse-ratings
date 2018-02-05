import { ajax } from 'discourse/lib/ajax';
import { popupAjaxError } from 'discourse/lib/ajax-error';

let ratingEnabled = function(type, tags, categoryId) {
  let category = Discourse.Category.findById(categoryId),
      catEnabled = category && category.rating_enabled,
      tagEnabled = tags && tags.filter(function(t){
                      return Discourse.SiteSettings.rating_tags.split('|').indexOf(t) !== -1;
                   }).length > 0,
      typeEnabled = type === 'rating';

  return catEnabled || tagEnabled || typeEnabled;
};

let removeRating = function(postId) {
  return ajax("/rating/remove", {
    type: 'POST',
    data: {
      post_id: postId,
    }
  }).then(function (result, error) {
    if (error) {
      popupAjaxError(error);
    }
  });
};

let editRating = function(postId, rating, rating1, rating2, rating3) {
  return ajax("/rating/rate", {
    type: 'POST',
    data: {
      post_id: postId,
      rating: rating,
      rating1: rating1,
      rating2: rating2,
      rating3: rating3
    }
  }).then(function (result, error) {
    if (error) {
      popupAjaxError(error);
    }
  });
};

let starRatingRaw = function(rating, opts = {}) {
  let content = '';
  for (let i = 0; i < 5; i++) {
    let value = i + 1;
    let checked = value <= rating ? 'checked' : '';
    let disabled = opts.enabled ? '' : ' disabled';
    let star = '';

    if (opts.clickable) {
      star += '<span class="' + checked + disabled + '"></span>';
    } else {
      star += '<input class="' + disabled + '"type="radio" value="' + value + '" ' + checked + disabled + '>';
    }

    star += '<i></i>';
    content = content.concat(star);
  }

  return '<span class="star-rating">' + content + '</span>';
};

let starRatingRawMean = function(r,r1,r2,r3){
  console.log("r,r1,r2,r3 : ", r,r1,r2,r3);
  return starRatingRaw((r+r1+r2+r3)/4);
};

export { ratingEnabled, removeRating, editRating, starRatingRaw, starRatingRawMean };
