import * as d3 from "d3"

class DataRepository {

  path: string
  data: any[]
  
  constructor(path: string) {
    this.path = path
    this.data = []
  }

  load = async() => {
    this.data = await d3.csv(this.path)
    for(let i = 0; i < this.data.length; i++) {
        if(this.data[i].Open === "null" || this.data[i].Open === "0.000000") this.data[i].Open = this.data[i-1].Close
        if(this.data[i].High === "null" || this.data[i].High === "0.000000") this.data[i].High = this.data[i-1].Close
        if(this.data[i].Low === "null" || this.data[i].Low === "0.000000") this.data[i].Low = this.data[i-1].Close
        if(this.data[i].Close === "null" || this.data[i].Close === "0.000000") this.data[i].Close = this.data[i-1].Close
        if(this.data[i]["Adj Close"] === "null" || this.data[i].Open === "0.000000") this.data[i]["Adj Close"] = this.data[i-1].Close
        if(this.data[i].Volume === "null" || this.data[i].Volume === "0.000000") this.data[i].Volume = this.data[i-1].Volume
    }
    for(let i = 0; i < this.data.length; i++) {
        this.data[i].Date = Date.parse(this.data[i].Date)
        this.data[i].Open = Math.round(parseFloat(this.data[i].Open))
        this.data[i].High = Math.round(parseFloat(this.data[i].High))
        this.data[i].Low = Math.round(parseFloat(this.data[i].Low))
        this.data[i].Close = Math.round(parseFloat(this.data[i].Close))
        this.data[i]["Adj Close"] = Math.round(parseFloat(this.data[i]["Adj Close"]))
        this.data[i].Volume = parseInt(this.data[i].Volume)
    }
    return this.data;
  }

  getData = (startDate: string, endDate: string) => {
      const start = Date.parse(startDate)
      const end = Date.parse(endDate)
      return this.data.filter(d => d.Date >= start && d.Date <= end)
  }
}

export default DataRepository