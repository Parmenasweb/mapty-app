'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor (coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    };

    _setDescription () {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration)
        this.cadence =  cadence;
        this.calcpace();
        this._setDescription();
    }

    calcpace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration)
        this.elevationGain =  elevationGain;
        this.calcspeed();
        this._setDescription();
    }

    calcspeed() {
        this.speed = this.distance/ (this.duration / 60)
        return this.speed
    }
}

const run1= new Running ([139, -21], 5.2, 24, 178);





//////////////////////////////////////////////////////////////////////////////////////////////////////


/////////////////// Application arcchitecture ///////////////////////////
class App {
    #map;
    #mapZoomLevel = 10;
    #mapEvent;
    #workOut = [];

    //  constructor
    
    constructor() {
        this._getPosition();

        //  get data from ;ocal storage
        this._getLocalStorage();

        // handling event listeners
        form.addEventListener("submit", this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField.bind(this));
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    };

    // get user position
    _getPosition() {
        if(navigator.geolocation)
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
            console.log('hi, thanks for sharing your location');
        });
    }

    _loadMap(position) {
        const {latitude} = position.coords;
        const {longitude} = position.coords;
        // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

        this.#map = L.map('map').setView([latitude, longitude], this.#mapZoomLevel);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);


    // adding an event on the map:
            this.#map.on("click", this._showForm.bind(this));

            // render marker on map after map is loaded
            this.#workOut.forEach(work => this._renderWorkoutMarker(work));
}

    _showForm(mapE) {
        this.#mapEvent = mapE;
                form.classList.remove('hidden');
                inputDistance.focus();
    }

    _hideForm() {
        // empty all form inputs 
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value ='';
        form.style.display = 'none'
        form.classList.add('hidden');

        setTimeout( ()=> form.style.display = 'grid', 1000);

    }

    _toggleElevationField(e) {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        e.preventDefault();
        // small helper function for checking if the parameters are numbers
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));

        // helper function for checking if the value of inputs are positive numbers
        const positiveNumber = (...inputs) => inputs.every(inp => inp>0)

        // get data from form

        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const {lat, lng} = this.#mapEvent.latlng;
        let workOut;

        
        // If workout is running , create running object
        if(type === 'running') {
            const cadence = +inputCadence.value;
            // check if data is valid
            if(!validInputs(distance, duration, cadence) || !positiveNumber(distance, duration, cadence)) return alert('inputs have to be valid');
            workOut = new Running([lat, lng], distance, duration, cadence);
            
        }
        
        // If workout is cycling , create cycling object
        if(type === 'cycling') {
            const elevation = +inputElevation.value;
            // check if data is valid
            if(!validInputs(distance, duration, elevation) || !positiveNumber(distance, duration, elevation)) return alert('inputs entered are nor valid');
            workOut = new Cycling ([lat, lng], distance, duration, elevation)
        };
        
        //  Add the new object to workout array
        this.#workOut.push(workOut)
        
        //  Render workout in the the workout list
        this._renderWorkoutMarker(workOut);
        this._renderWorkout(workOut);
        this._hideForm();

        // set local storage for all newly created workouts
        this._setLocalStorage();

    // clear input fields for all input after submitting
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value ='';

    // Render workout on map as a marker
};
    _renderWorkoutMarker(workout){
        L.marker(workout.coords).addTo(this.#map)
        .bindPopup(L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`
        }))
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();
    };

    //  Method for rendering the workouts in list

    _renderWorkout (workOut) {
        let html = `
        <li class="workout workout--${workOut.type}" data-id="${workOut.id}">
          <h2 class="workout__title">${workOut.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workOut.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workOut.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workOut.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;

        if(workOut.type === 'running') 
        html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workOut.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workOut.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
            </li>
        `;

        if(workOut.type === 'cycling')

        html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workOut.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workOut.elevationGain}</span>
                <span class="workout__unit">m</span>
            </div>
        </li>
        `;

        //  Adding the workout adjascent to the form
        form.insertAdjacentHTML("afterend", html)
    }

    //  method for moving the map to the list workout clicked on
    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');

        if(!workoutEl) return

        const workout = this.#workOut.find(work => work.id === workoutEl.dataset.id);
        // leaflet method for moving the map to a specific location using the setview method
        this.#map.setView(workout.coords, this.#mapZoomLevel, {animate: true, pan: {duration: 1}}); 
    };

    //  Private method for adding all workouts to local storage
    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workOut));
    }

    //  method fpr retrieveing all the workouts from the local storage after page reload
    _getLocalStorage() {
        const data =JSON.parse(localStorage.getItem("workouts"));

        if(!data) return;

        this.#workOut = data;

        this.#workOut.forEach(work => {
            this._renderWorkout(work)})
        };

        // Method for reseting local storage and reloading the page
        reset() {
            localStorage.removeItem('workouts');
            localStorage.clear
            location.reload();                                                                                                                                  
        };


};

//  creating an object app from the App class
const app = new App(); 
