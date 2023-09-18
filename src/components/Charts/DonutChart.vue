<template>
  <div :class="className" :title="title" :color="color" :isTime="isTime" :style="{height:height,width:width}" />
</template>

<script>
import echarts from 'echarts'
require('echarts/theme/macarons') // echarts theme
import resize from './mixins/resize'
import moment from 'moment'
import momentDurationFormatSetup from 'moment-duration-format'

export default {
  mixins: [resize],
  props: {
    className: {
      type: String,
      default: 'chart'
    },
    title: {
      type: String,
      default: 'PieChart'
    },
    color: {
      type: String,
      default: '#67C23A'
    },
    isTime: {
      type: Boolean,
      default: false,
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '300px'
    },
    donutData: {
      type: Array,
      default: null
    }
  },
  data() {
    return {
      chart: null
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initChart()
    })
  },
  beforeDestroy() {
    if (!this.chart) {
      return
    }
    this.chart.dispose()
    this.chart = null
  },
  methods: {
    initChart() {
      let valueList = this.donutData.map(d=>d.value)
      let percent = valueList.reduce((a,b)=>a+b) ? (valueList[0]/valueList.reduce((a,b)=>a+b) * 100).toFixed(2) : 0
      let _this  = this
      this.chart = echarts.init(this.$el, 'macarons')
      this.chart.setOption({
        title: {
          text: this.title,
          textStyle: {
            color: 'black',
            fontWeight: 'bold'
          }
        },
        color: [ this.color, '#909399'],
        tooltip: {
          trigger: 'item',
          formatter: '{b} : {c} ({d}%)'
        },
        graphic: {
          type: 'text',
          cursor: 'auto',
          z: 100,
          left: 'center',
          top: 'middle',
          scale: [3, 3],
          style: {
            fill: this.color,
            text: percent+'%',
          }
        },
        series: [
          {
            name: 'donutChart',
            type: 'pie',
            radius: [70, '80%'],
            hoverAnimation: false,
            // center: ['50%', '38%'],
            data: this.donutData,
            label: {
              position: 'inside',
              // formatter: '{b} \n {c}',
              formatter(v) {
                if(_this.isTime) {
                  return v.name +"\n"+ moment.duration(v.value, 'seconds').format('HH:mm:ss', {trim: 'small'})
                } else {
                  // return v.name +"\n"+ v.value
                  return ""
                }
              },
              fontSize: 18
            },
            animationEasing: 'cubicInOut',
            animationDuration: 2600
          }
        ],
      })
      this.chart.on('mouseover', (params) => {
        if (params.name === this.donutData[1]['name']) {
          this.chart.setOption({ animation: false });
          this.chart.dispatchAction({
            type: 'downplay',
            name: params.name
          });   
          this.chart.setOption({ animation: true }); 
        }
      });
    }
  }
}
</script>
