import Composer from 'discourse/models/composer';
import { withPluginApi } from 'discourse/lib/plugin-api';
import { default as computed, on, observes } from 'ember-addons/ember-computed-decorators';
import { ratingEnabled, removeRating, editRating, starRatingRaw } from '../lib/rating-utilities';

export default {
  name: 'ratings-edits',
  initialize(){

    Composer.serializeOnCreate('rating');
    Composer.serializeOnCreate('rating1');
    Composer.serializeOnCreate('rating2');
    Composer.serializeOnCreate('rating3');

    Composer.serializeOnCreate('rating_target_id', 'rating_target_id');
    Composer.serializeToTopic('rating_target_id', 'topic.rating_target_id');

    withPluginApi('0.8.10', api => {
      api.includePostAttributes('rating');
      api.includePostAttributes('rating1');
      api.includePostAttributes('rating2');
      api.includePostAttributes('rating3');

      api.decorateWidget('poster-name:after', function(helper) {
        const rating = helper.attrs.rating;
        const rating1 = helper.attrs.rating1;
        const rating2 = helper.attrs.rating2;
        const rating3 = helper.attrs.rating3;

        const model = helper.getModel();

        if (model && model.topic && model.topic.rating_enabled && rating) {
          let html = new Handlebars.SafeString(
          '<div><br><b>Punctuality'+starRatingRaw(rating)
          +'<br>Cleanliness'+starRatingRaw(rating1)
          +'<br>Food'+starRatingRaw(rating2)
          +'<br>Uncrowded'+starRatingRaw(rating3)
          +'</b></div>');
          return helper.rawHtml(`${html}`);
        }
      });

      api.modifyClass('model:composer', {
        includeRating: true,
        includeRatingTargetId: false,
        ratingTargetId: undefined,

        @on('init')
        @observes('post')
        setRating() {
          const post = this.get('post');
          if (this.get('editingPost') && post && post.rating) {
            this.set('rating', post.rating);
            this.set('rating1', post.rating1);
            this.set('rating2', post.rating2);
            this.set('rating3', post.rating3);
          }
        },

        @computed('subtype','tags','categoryId')
        ratingEnabled(subtype, tags, categoryId) {
          return ratingEnabled(subtype, tags, categoryId);
        },

        @computed('ratingEnabled', 'hideRating', 'topic', 'post')
        showRating(enabled, hide, topic, post) {
          if (hide) return false;

          if ((post && post.get('firstPost') && topic.rating_enabled) || !topic) {
            return enabled;
          }

          if (topic.can_rate) return true;

          return topic.rating_enabled && post && post.rating && (this.get('action') === Composer.EDIT);
        },

        @computed('ratingEnabled')
        showRatingTargetId(enabled) {
          const user = this.user;
          const setting = Discourse.SiteSettings.rating_target_id_enabled;
          return enabled && setting && user.admin;
        },

        @observes('topic.rating_target_id')
        renderRatingTargetIdInput() {
          const topicRatingTargetId = this.get('topic.rating_target_id');
          const ratingTargetId = this.get('rating_target_id');
          if (topicRatingTargetId && ratingTargetId === undefined) {
            this.set('rating_target_id', topicRatingTargetId);
            this.set('showRatingTargetId', false);
            this.set('showRatingTargetId', true);
          }
        }
      });

      api.modifyClass('controller:composer', {
        actions: {
          save() {
            const firstPost = this.get('model.action') == 'createTopic' || this.get('model.post.post_number') == 1;
            const showRating = this.get('model.showRating');
            const includeRating = this.get('model.includeRating');
            const rating = this.get('model.rating');
            const rating1 = this.get('model.rating1');
            const rating2 = this.get('model.rating2');
            const rating3 = this.get('model.rating3');

            if (showRating && includeRating && !firstPost && ( !rating || !rating1 || !rating2 || !rating3) ) {
              return bootbox.alert(I18n.t("composer.select_rating"));
            }

            this.save().then(() => {
              if (showRating && includeRating && rating) {
                const controller = this.get('topicController');
                controller.toggleCanRate();
              }
            });
          }
        },

        @observes('model.composeState')
        saveRatingAfterEditing() {
          // only continue if user was editing and composer is now closed
          if (!this.get('model.showRating')
             || this.get('model.action') !== Composer.EDIT
             || this.get('model.composeState') !== Composer.SAVING) { return; }

          const post = this.get('model.post');
          const rating = this.get('model.rating');
          const rating1 = this.get('model.rating1');
          const rating2 = this.get('model.rating2');
          const rating3 = this.get('model.rating3');

          if (rating && !this.get('model.includeRating')) {
           removeRating(post.id);
           const controller = this.get('topicController');
           controller.toggleCanRate();
          } else {
           editRating(post.id, rating, rating1, rating2, rating3);
          }
        }
      });

      api.modifyClass('component:composer-body', {
        @observes('composer.showRating')
        resizeIfShowRating: function() {
          if (this.get('composer.composeState') === Composer.OPEN) {
            this.resize();
          }
        }
      });

      api.modifyClass('model:topic', {
        @computed('subtype','tags','category_id')
        ratingEnabled(type, tags, categoryId) {
          return ratingEnabled(type, tags, categoryId);
        },

        @computed('ratingEnabled')
        showRatingTip(enabled) {
          return enabled && this.siteSettings.rating_show_topic_tip;
        }
      });

      api.modifyClass('controller:topic', {
        refreshAfterTopicEdit: false,
        unsubscribed: false,

        unsubscribe() {
          const topicId = this.get('content.id');
          if (!topicId) return;
          const messageBus = this.messageBus;
          if (messageBus) {
            messageBus.unsubscribe('/topic/*');
            this.set('unsubscribed', true);
          }
        },

        @observes('unsubscribed', 'model.postStream')
        subscribeToRatingUpdates() {
          const unsubscribed = this.get('unsubscribed');
          const model = this.get('model');
          const subscribedTo = this.get('subscribedTo');

          if (!unsubscribed) return;
          this.set('unsubscribed', false);

          if (model && model.id === subscribedTo) return this.set('subscribedTo', null);
          this.set('subscribedTo', null);

          if (model && model.get('postStream') && model.rating_enabled) {
            const refresh = (args) => this.appEvents.trigger('post-stream:refresh', args);

            this.messageBus.subscribe("/topic/" + model.id, function(data) {
              if (data.type === 'revised') {
                if (data.averages !== undefined) {
                  model.set('average_rating', data.averages[0]);
                  model.set('average_rating1', data.averages[1]);
                  model.set('average_rating2', data.averages[2]);
                  model.set('average_rating3', data.averages[3]);
                }
                if (data.post_id !== undefined) {
                  model.get('postStream').triggerChangedPost(data.post_id, data.updated_at).then(() =>
                    refresh({ id: data.post_id })
                  );
                }
              }
            });

            this.set('subscribedTo', model.id);
          }
        },

        @observes('editingTopic')
        refreshPostRatingVisibility() {
          if (!this.get('editingTopic') && this.get('refreshAfterTopicEdit')) {
           this.get('model.postStream').refresh();
           this.set('refreshAfterTopicEdit', false);
          }
        },

        toggleCanRate() {
          if (this.get('model')) {
            this.toggleProperty('model.can_rate');
          }
        }
      });
    });
  }
};
