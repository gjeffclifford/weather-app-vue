<template>
  <q-page class="flex content-center">
    <div class="q-pa-md container-weather m-1">
      <div class="row">
        <div class="col">
          <q-select
            filled
            bottom-slots
            use-input
            @filter="filterFn"
            v-model="selectedPlace"
            :options="options"
            label="Search Place Here"
            @update:model-value="getWeather"
            clearable
          >
          </q-select>
        </div>
      </div>
      <q-inner-loading :showing="isLoading" />
      <div class="row" v-if="weathers.length && selectedPlace && !isLoading">
        <div class="col" style="max-height: 70vh; overflow-x:auto;">
          <table style="width: 100%;">
            <tbody>
              <tr>
                <td v-for="(weather, index) in weathers" :key="index" class="m-10">
                  <div class="d-flex content-center">
                    <img :src=getImage([weather.weather[0].icon]) alt="">
                  </div>
                  <div class="text-center">
                    {{ toCalendarTime(weather)}}
                  </div>
                  <div class="text-center">
                    {{ toUcWords(weather.weather[0].description) }}
                  </div>
                  <div class="text-center">
                    {{ toCelsius(weather.main.temp) }}&deg;C
                  </div>
                </td>
                <!-- <td></td>
                <td></td>
                <td></td> -->
              </tr>
              <tr>
                <td v-for="(weather, index) in weathers" :key="index" class="m-10">
                  <div class="text-center c">
                    <em class="text-gray text-center" @click="showInfo(weather)">More Details</em>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="row container-weather">
      <div class="col col-md-6 col-xs-12" v-if="selectedPlace && !isLoading">
        <iframe class="q-pa-md text h-100 w-100" :src="mapUrl" frameborder="0"></iframe>
      </div>
      <div class="col col-md-6 col-xs-12" v-if="selectedWeather && selectedPlace && !isLoading">
        <div class="q-pa-md text w-100">
          <div class="row">
            Weather Tip: {{ getWeatherTip(selectedWeather) }}
          </div>
          <div class="row">
            Date: {{ toCalendarTime(selectedWeather, true)}}
          </div>
          <div class="row">
            Temp: {{ toCelsius(selectedWeather.main.temp) }}&deg;C
          </div>
          <div class="row">
            Feel Like: {{ toCelsius(selectedWeather.main.feels_like) }}&deg;C
          </div>
          <div class="row">
            Humidity: {{ selectedWeather.main.humidity }}%
          </div>
          <div class="row">
            Wind Speed: {{ selectedWeather.wind.speed }} m/s
          </div>
          <div class="row">
            Wind Gust: {{ selectedWeather.wind.gust }} m/s
          </div>
          <div class="row">
            Wind Direction: {{ selectedWeather.wind.deg }} &deg;
          </div>
        </div>
      </div>
      <div class="col col-md-6 col-xs-12" v-if="selectedPlace && selectedWeather == null && !isLoading">
        <div class="q-pa-md text h-100 content-center w-100">
          <em class="text-gray text-center">Click "More details" to display information here</em>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { ref, onMounted } from 'vue'
import moment from "moment";

export default defineComponent({
  name: 'IndexPage',
  data: () => {
    return {
      options: [],
      selectedPlace: "",
      searchDebounce: null,
      weathers: [],
      selectedWeather: null,
      isLoading: ref(false)
    }
  },
  watch: {
    selectedPlace(newValue){
      if(newValue !== null) {
        this.selectedWeather = null
        this.getWeather(newValue.value)
      }
    }
  },
  computed: {
    mapUrl() {
      let properties = this.selectedPlace.value.properties
      // return "google.com"
      return `https://maps.google.com/maps?q=${properties.lat},${properties.lon}&z=15&output=embed`
    }
  },
  methods: {
    async filterFn(keyword, update) {
      if(keyword) {
        clearTimeout(this.searchDebounce)
        this.searchDebounce = window.setTimeout(async () => {
          await this.$store.dispatch('weather/getPlaces', {keyword}).then(async (response) => {
            update(() => {
              this.options = response.features.map((opt) => {
                return {
                  label: opt.properties.formatted,
                  value: opt
                }
              })
            })
          })
        }, 1000)
      }
    },
    showInfo(weather) {
      console.log("weather", weather)
      this.selectedWeather = weather
    },
    getWeather(value){
      if (value) {
        this.isLoading = true
        this.$store.dispatch('weather/getWeather', {lat: value.properties.lat, lon: value.properties.lon}).then(async (response) => {
          this.weathers = response.list
          this.isLoading = false
        })
      }
    },
    toCelsius(temperature) {
      return (temperature-273.15).toFixed(1)
    },
    toUcWords(str) {
      return str.toLowerCase().replace(/\b[a-z]/g, function(letter) {
          return letter.toUpperCase();
      });
    },
    getImage(icon) {
      return `http://openweathermap.org/img/wn/${icon}@2x.png`
    },
    toCalendarTime(weather, withToday) {
      if (withToday) {
        return moment(weather.dt_txt).calendar().toString()
      }
      return moment(weather.dt_txt).calendar().toString().replace("Today at","")
    },
    getWeatherTip(weather) {
      if(
        weather.weather[0].description.includes("rain") || 
        weather.weather[0].description.includes("thunderstorm") || 
        weather.weather[0].description.includes("drizzle")
      ) {
        if(
          weather.weather[0].description.includes("heavy") || 
          weather.weather[0].description.includes("extreme") || 
          weather.weather[0].description.includes("ragged")
        ) {
          return "Best to stay indoors!"
        } else {
          return "Best to bring an umbrella or any rain protection"
        }
      } else if (weather.weather[0].description.includes("clear")) {
        return "Wear sunscreen if you will be outside for too long"
      } else if (weather.weather[0].description.includes("snow")) {
        if(
          weather.weather[0].description.includes("heavy") || 
          weather.weather[0].description.includes("extreme")
        ) {
          return "Best to stay indoors!"
        } else {
          return "Wear clothes that will keep you warm"
        }
      } else if (weather.weather[0].description.includes("snow")) {
        return "Wear clothes that will keep you warm"
      } else if (
        weather.weather[0].description.includes("fog") ||
        weather.weather[0].description.includes("mist") ||
        weather.weather[0].description.includes("smoke")
      ) {
        return "Be careful when driving."
      } else if (
        weather.weather[0].description.includes("ash") ||
        weather.weather[0].description.includes("tornado") ||
        weather.weather[0].description.includes("squall")
      ) {
        return "Best to stay indoors!"
      } else {
        return "No available information"
      }
    }
  },
  setup() {
    onMounted(() => {
      console.log(process.env.WEATHER_API)
    })
  }
})
</script>
