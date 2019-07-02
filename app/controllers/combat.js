import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import AuthenticatedController from 'ares-webportal/mixins/authenticated-controller';

export default Controller.extend(AuthenticatedController, {
    gameApi: service(),
    gameSocket: service(),
    flashMessages: service(),
    newCombatantName: '',
    newCombatantType: 'Soldier',
    newCombatActivity: false,
    confirmRemoveCombatant: false,
    combatLog: '',
    
    pageTitle: function() {
        return `Combat ${this.get('model.id')}`;
    }.property(),
    
    onCombatActivity: function(msg) {
      this.set('newCombatActivity', true);
      
      let splitMsg = msg.split('|');
      let combatId = splitMsg[0];       
      let message = splitMsg[1];
      
      if (combatId === this.get('model.id')) {
        this.set('combatLog', this.get('combatLog') + "\n" + message);
        try {
          $('#combat-log').stop().animate({
              scrollTop: $('#combat-log')[0].scrollHeight
          }, 800); 
        }
        catch(error) {
          // This happens sometimes when transitioning away from screen.
        }   
      }
    },
    
    resetOnExit: function() {
        this.set('newCombatantName', '');
        this.set('newCombatantType', '');
        this.set('confirmRemoveCombatant', false);
        this.set('newCombatActivity', false);
        this.set('combatLog', '');
    },
    
    setupCallback: function() {
        let self = this;
        
        this.get('gameSocket').set('combatCallback', function(data, timestamp) {
            self.onCombatActivity(data) } );
    },
    
    addToCombat(name, type) {
      if (name.length === 0) {
          this.get('flashMessages').danger('Name is required.');
          return;
      } 
      if (!type) {
        this.get('flashMessages').danger('You must select a type.');
        return
      }
      
      let api = this.get('gameApi');
          api.requestOne('addCombatant', { id: this.get('model.id'), 
             name: name,
             combatant_type: type }, null)
          .then( (response) => {
              if (response.error) {
                  return;
              }
              this.get('flashMessages').success('Combatant added!');
          });
    },
    
    removeFromCombat(name) {
      let api = this.get('gameApi');
      api.requestOne('removeCombatant', { name: name, id: this.get('model.id') }, null)
      .then( (response) => {
          if (response.error) {
              return;
          }
          this.get('flashMessages').success('Combatant removed!');
      });
    },
    
    actions: {
        addCombatant: function() {
          let name = this.get('newCombatantName');
          let type = this.get('newCombatantType');
          this.addToCombat(name, type);            
        },
        joinCombat: function() {
          let name = this.get('currentUser.name')
          let type = this.get('newCombatantType');
          this.addToCombat(name, type);            
        },
        newTurn: function() {
            let api = this.get('gameApi');
            api.requestOne('newCombatTurn', { id: this.get('model.id') }, null)
            .then( (response) => {
                if (response.error) {
                    return;
                }
                this.get('flashMessages').success('Combat turn started!');
            });
            
        },
        leaveCombat: function() {
          let name = this.get('currentUser.name')
          this.removeFromCombat(name);
        },
        removeCombatant: function(name) {
          this.set('confirmRemoveCombatant', false);
          this.removeFromCombat(name);
        },
        combatantTypeChanged: function(type) {
            this.set('newCombatantType', type);
        }
    }
});