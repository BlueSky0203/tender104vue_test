<template>
  <div :class="className" :title="title" />
</template>

<script>
import echarts from 'echarts/lib/echarts';
require('echarts/theme/macarons') // echarts theme
require('echarts/lib/chart/pie');
import resize from './mixins/resize'

export default {
  mixins: [ resize ],
  props: {
    className: {
      type: String,
      default: 'chart'
    },
    title: {
      type: String,
      default: 'PieChart'
    },
    pieData: {
      type: Object,
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
      this.chart = echarts.init(this.$el, 'macarons')
      let color = ["#2ec7c9","#b6a2de","#5ab1ef","#ffb980","#d87a80","#8d98b3","#e5cf0d","#97b552","#95706d","#dc69aa","#07a2a4","#9a7fd1","#588dd5","#f5994e","#c05050","#59678c","#c9ab00","#7eb00a","#6f5553","#c14089"]

      if(this.pieData.data.length == 0) {
        this.chart.setOption({
          title: {
            text: this.title,
            textStyle: {
              color: 'black',
              fontWeight: 'bold'
            }
          },
          graphic: {
            type: 'text',
            cursor: 'auto',
            z: 100,
            left: 'center',
            top: 'middle',
            scale: [3, 3],
            style: {
              fill: 'gray',
              text: '目前沒有資料',
            }
          },
        })
      } else {
        this.chart.setOption({
          title: {
            text: this.title,
            textStyle: {
              color: 'black',
              fontWeight: 'bold'
            }
          },
          color: color,
          tooltip: {
            trigger: 'item',
            // formatter: '{a} <br/>{b} : {c} ({d}%)'
            formatter: '{b} : {d}%'
          },
          legend: {
            // width: '85%',
            orient: 'vertical',
            type: 'plain',
						top: 'bottom',
						left: 'left',
            // selectedMode: false,
            // right: 'center',
            // bottom: '10',
            data: this.pieData.data.map(data=>data.name)
          },
          series: [
            {
              type: this.pieData.chartType,
							radius: '50%',
              center: ['50%', '45%'],
              data: this.pieData.data,
							label: {
								formatter: '{d}%'
							},
              labelLine: {
                length: 2,
              },
              animationEasing: 'cubicInOut',
              animationDuration: 2600
            }
          ],
          animation: true
        })
        this.chart.on('legendselectchanged', (params) => {
          this.chart.setOption({ animation: false });
          this.chart.dispatchAction({
            type: 'legendSelect',
            name: params.name
          });
          this.chart.dispatchAction({
            type: 'showTip',
            name: params.name
          });
          this.chart.setOption({ animation: true }); 
        });
      }
    }
  }
}
</script>
