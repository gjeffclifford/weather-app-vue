import {api} from "src/boot/axios"
export default {
  handler: () => {
    
  },
  async getPlaces({}, params) {
    return await api.get(`/api/place?keyword=${params.keyword}`).then((response)=>{
      return response.data
    })
  },
  async getWeather({}, params) {
    return await api.get(`/api/weather`, {params}).then((response)=>{
      return response.data
    })
  }
}