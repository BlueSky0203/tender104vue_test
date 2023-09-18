<template>
	<div class="car-monitor" v-loading="loading"> 
		<h2>即時影像</h2>
		<el-row>
			<el-col :span="6" v-for="zip in zipCodeOrder" :key="zip">
				<div class="car-vod-panel">
					<div class="car-vod-title">{{ districtList[zip].name }}</div>
					<i class="el-icon-video-camera" v-if="!districtList[zip].src"/>
					<iframe v-else height="100%" width="100%" :src="districtList[zip].src" frameborder="0" allowfullscreen allow="autoplay" onerror="this.onerror=null; this.src=''" />
				</div>
			</el-col>
		</el-row> 

	</div>
</template>

<script>
import moment from 'moment';
import { getInspectionList } from "@/api/car";

export default {
	name: "carMonitor",
	directives: { },
	data() {
		return {
			loading: false,
			mediaAPIUrl: process.env.VUE_APP_MEDIA_API,
			mediaGCSUrl: process.env.VUE_APP_MEDIA_URL,
			districtList: {
				100: {
					name: "中正區",
					order: 5,
					contractId: 0,
					src: "https://www.gstech.com.tw/ec/FLTLMVideo.aspx?group=FL383&carid=RCX-8095&vno=0&type=fuho"
				},
				103: {
					name: "大同區",
					order: 1,
					contractId: 1, 
					carId: 1
				},
				104: {
					name: "中山區",
					order: 2,
					contractId: 1, 
					carId: 3
				},
				105: {
					name: "松山區",
					order: 3,
					contractId: 2, 
					carId: 1
				},
				106: {
					name: "大安區",
					order: 11,
					contractId: 0,
					src: "https://www.gstech.com.tw/ec/FLTLMVideo.aspx?group=FL383&carid=RCX-7561&vno=0&type=fuho"
				},
				108: {
					name: "萬華區",
					order: 6,
					contractId: 0,
					src: "https://www.gstech.com.tw/ec/FLTLMVideo.aspx?group=FL383&carid=RCX-7562&vno=0&type=fuho"
				},
				110: {
					name: "信義區",
					order: 4,
					contractId: 2, 
					carId: 2
				},
				111: {
					name: "士林區",
					order: 9,
					contractId: 5, 
					carId: 1
				},
				112: {
					name: "北投區",
					order: 10,
					contractId: 5, 
					carId: 2
				},
				114: {
					name: "內湖區",
					order: 7,
					contractId: 4, 
					carId: 2
				},
				115: {
					name: "南港區",
					order: 8,
					contractId: 4, 
					carId: 1
				},
				116: {
					name: "文山區",
					order: 12,
					contractId: 0,
					src: "https://www.gstech.com.tw/ec/FLTLMVideo.aspx?group=FL383&carid=RCX-7560&vno=0&type=fuho"
				}
			},
			options: {
				contractId: {
					1: "一標",
					2: "二標",
					3: "三標",
					4: "四標",
					5: "五標",
					// 6: "六標"
				},
				carId: {
					1: {
						1: "RDX-6883", //大同
						2: "RDQ-6279", 
						3: "RDX-6881", //中山
					},
					2: {
						1: "ATE-3236", //松山
						2: "BFX-7552", //信義
					},
					3: {
						1: "ALV-3038",
						2: "APD-3308",
						3: "AAA-0000",
					},
					4: {
						1: "ATE-3287", //南港
						2: "ATE-3192", //內湖
					},
					5: {
						1: "BPG-0891", //士林
						2: "BFX-7551", //北投
					}
				}
			}
		};
	},
	computed: {
		zipCodeOrder() {
			return Object.keys(this.districtList).sort((a, b) => this.districtList[a].order - this.districtList[b].order);
		}
	},
	async created() { 
		for(const zipCode in this.districtList) {
			const distInfo = this.districtList[zipCode];
			if(distInfo.contractId != 0 ) {
				this.$set(distInfo, "src", await this.getVodSrc(distInfo));
			}
		}
	},
	mounted() { },
	methods: {
		async getVodSrc(distInfo) {	
			return new Promise( resolve => {
				getInspectionList({
					contractId: distInfo.contractId,
					modeId: 3,
					carId: distInfo.carId,
					date: moment().format("YYYY-MM-DD")
				}).then(response => {
					if (response.data.list.length == 0) resolve("");
					else {
						const carInfo =  response.data.list[0];
						console.log(carInfo.liveStreamId);
						const src = `${this.mediaAPIUrl}WebRTCAppEE/play.html?name=${carInfo.liveStreamId}`;
						resolve(src);
					}
					// this.loading = false;
				}).catch(err => { this.loading = false; });
			})		
		},

	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.car-monitor
	position: relative
	width: 100%
	// height: calc(100vh - 50px)
	.car-vod-panel
		position: relative
		height: calc((100vh - 140px) / 3)
		background-color: #EBEEF5
		border: 1px solid #F2F6FC
		.car-vod-title
			position: absolute
			top: 12px
			left: 50%
			transform: translateX(-50%)
			padding: 2px 5px
			color: #909399
			font-size: 16px
			z-index: 10
			background-color: rgba(#000, 0.1)
		i.el-icon-video-camera
			position: absolute
			top: 50%
			left: 50%
			transform: translate(-50%, -50%)
			color: white
			font-size: 500%
			opacity: 0.8
		iframe
			position: absolute
			bottom: 0
			left: 50%
			transform: translate(-50%)
			overflow: hidden
			aspect-ratio: 16/9 
			height: auto
			width: 100%
</style>