<template>
	<div class="case-detail">
		<el-table
			ref="caseDetail"
			:loading="loading"
			empty-text="目前沒有資料"
			:data="detail"
			border
			fit
			highlight-current-row
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			stripe
			style="width: 100%"
		>
			<el-table-column label="欄位" prop="column" min-width="45" align="center" />
			<el-table-column label="內容" prop="content" min-width="100" align="center">
				<template slot-scope="{ row, column }">
					<span v-if="String(row[column.property]).match(/.JPG|.jpg|.Jpg/g)">
						<!-- <el-link :href="row[column.property]" target="_blank" :underline="false"> -->
							<el-image v-for="img in row[column.property]" :key="img" class="img-preview" style="width: 100%; height: 100%; cursor: pointer" :src="img" :preview-src-list="imgUrls" fit="contain" :z-index="9999" />
						<!-- </el-link> -->
					</span>
					<span v-else-if="row.prop == 'position'">
						<span>{{ row[column.property] || "-" }}</span>
						<el-popover class="dialog-map" v-model="dialogMapVisible" placement="top-start" width="500" trigger="hover" @show="showMapViewer(row)">
							<map-viewer :map.sync="map"/>
							<el-button slot="reference" class="btn-action" type="info" icon="el-icon-search" plain size="mini" round />
						</el-popover>
					</span>
					<span v-else-if="row.prop == 'otherImage' && otherImage.length > 0">
						<el-button :type="otherImage.length > 0 && !isExpand ? 'success' : 'info'" plain style="width: 100%" @click="toggleExpand(row)">{{ isExpand ? '收起' : '展開' }}</el-button>
					</span>
					<span v-else>
						<span style="white-space: pre-line">{{ row[column.property] || "-" }}</span>
					</span>
				</template>
			</el-table-column>
			<el-table-column type="expand" width="1" align="center" style="display: none">
				<template slot-scope="{ row }">
					<el-table
						:loading="loading"
						empty-text="目前沒有資料"
						:data="otherImage"
						border
						fit
						highlight-current-row
						:header-cell-style="{ 'background-color': '#F2F6FC' }"
						stripe
						style="width: 100%"
					>
						<el-table-column prop="column" min-width="45" align="center" />
						<el-table-column prop="content" min-width="100" align="center">
							<template slot-scope="{ row, column }">
								<span v-if="String(row[column.property]).match(/.JPG|.jpg|.Jpg/g)">
									<el-image v-for="img in row[column.property]" :key="img" class="img-preview" style="width: 100%; height: 100%; cursor: pointer" :src="img" :preview-src-list="imgUrls" fit="contain" :z-index="9999" />
								</span>
							</template>
						</el-table-column>
					</el-table>
				</template>
			</el-table-column>
		</el-table>
	</div>
</template>

<script>
import moment from "moment";
import { getRestoredImgMap } from "@/api/type";
import { getCaseDetail } from "@/api/dispatch";
import MapViewer from "@/components/MapViewer";

export default {
	name: "caseDetail",
	components: { MapViewer },
	props: {
		loading: {
			required: true,
			type: Boolean
		},
		showDetailDialog: {
			required: true,
			type: Boolean
		},
		deviceTypeNow: {
			required: true,
			type: Number
		}
	},
	data() {
		return {
			isExpand: false,
			showImgViewer: false,
			dialogMapVisible: true,
			map: {},
			headersDetail: {
				casetype: {
					name: "查報來源",
				},
				SerialNo: {
					name: "系統編號",
				},
				CaseSN: {
					name: "申請單號",
				},
				// paperkind: {
				// 	name: "申請單類別",
				// },
				// run1tflag: {
				// 	name: "申請單流程",
				// },
				TBName: {
					name: "區別",
				},
				Postal_vil: {
					name: "里別",
				},
				CaseSucc: {
					name: "通報單號",
				},
				CaseNo: {
					name: "案件編號",
				},
				DateCreate: {
					name: "成案日期",
				},
				// reporter: {
				// 	name: "查報人員",
				// },
				Place: {
					name: "案件地點",
				},
				CaseStatus: {
					name: "案件類型",
				},
				CaseProcess: {
					name: "案件流程",
				},
				Formula: {
					name: "算式及面積",
					deviceTypeFilter: [1, 2]
				},
				MillingDepth: {
					name: "刨鋪深度",
					deviceTypeFilter: [1, 2]
				},
				position: {
					name: "案件位置",
				},
				ImgZoomIn: {
					name: "施工前近照",
				},
				ImgZoomOut: {
					name: "施工前遠照",
				},
				UnderConstrImg: {
					name: "施工中照片"
				},
				PostConstrImg: {
					name: "施工後照片"
				},
				MarkingImg: {
					name: "補繪標線照片"
				}
			},
			detail: [],
			otherImage: [],
			options: {
				RoadType: {
					1: "道路",
					2: "設施",
					3: "橋涵"
				},
				DistressLevel: {
					1: "輕度",
					2: "中度",
					3: "重度"
				},
				paperkind: {
					1: "銑鋪申請單",
					2: "設施申請單",
					3: "標線申請單",
					4: "坑洞臨補單",
					5: "分隊交辦案件",
					6: "塗佈申請單"
				},
				run1tflag: {
					0: "未送件",
					"s": "未印申請單",
					"a": "組長審核",
					"b": "主任審核",
					"c": "主任抽件",
					"d": "監造應送分隊",
					"e": "分隊審核",
					"f": "隊部審核",
					"g": "分隊回公司審核",
					1: "分隊抽件",
					2: "隊部抽件",
					3: "分隊交辦",
					4: "已完成申請單"  
				},
				workmemo: {
					"uStacker": "堆高機",
					"uDigger": "挖土機",
					"uPaver": "鋪裝機",
					"uRoller": "壓路機",
					"uSprinkler": "灑水車",
					"uNotes": "備註"
				},
				restoredImgMap: []
			}
		}
	},
	computed: {	
		headersDetailFilter() {
			let headersDetailFilter = {};
			Object.keys(this.headersDetail).forEach(key => {
				const props = this.headersDetail[key];
				if(!props.hasOwnProperty('deviceTypeFilter')) headersDetailFilter[key] = props;
				else if(props.deviceTypeFilter.includes(this.deviceTypeNow)) headersDetailFilter[key] = props;
			})
			return headersDetailFilter
		},
		imgUrls() {
			const detailFilter = this.detail.filter(row => ['ImgZoomIn', 'ImgZoomOut'].includes(row.prop) || row.prop.endsWith("Img")).map(row => row.content).flat();
			const otherImgFilter = this.otherImage.map(row => row.content).flat();
			return [...detailFilter, ...otherImgFilter ];
		},
	},
	created() { 
		getRestoredImgMap().then(response => { this.options.restoredImgMap = response.data.restoredImgMap });
	},
	mounted() {
		this.dialogMapVisible = false;
	},
	methods: {
		toggleExpand(row) {
			this.isExpand = !this.isExpand;
			this.$refs.caseDetail.toggleRowExpansion(row, this.isExpand);
		},
		showMapViewer(row) {
			// console.log("showMap");
			this.map.data.forEach(feature => this.map.data.remove(feature));
			this.dialogMapVisible = true;

			let geoJSON_case = { 
				"type": "FeatureCollection",
				"name": "polyJSON",
				"features": []
			};

			geoJSON_case.features.push({
				"type": "Feature",
				"properties": { },
				"geometry": row.Coordinate
			});

			this.map.data.addGeoJson(geoJSON_case);

			this.map.setCenter({ lat: row.Coordinate.coordinates[1], lng: row.Coordinate.coordinates[0] });
			const zoom = this.map.getZoom();
			this.map.setZoom(zoom < 20 ? 20 : zoom);
		},
		getDetail(row) {
			// console.log(row);
			this.detail = [];
			this.otherImage = [];
			let deviceType = this.deviceTypeNow;

			// 補繪標線查詢原始案件
			if(deviceType == 4) {
				if (row.RoadType == 1 && row.RestoredType == 1) deviceType = 1;
				else if (row.RoadType == 1 && row.RestoredType == 2) deviceType = 2;
				else if ([2, 3].includes(row.RoadType)) deviceType = 3;
			}

			getCaseDetail({ serialNo: row.SerialNo, deviceType }).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					const caseObj = response.data.list[0];
					// console.log(caseObj);
					for(const key in this.headersDetailFilter) {
						if(key == 'CaseStatus') this.detail.push({ prop: key, column: this.headersDetail[key].name, content: `${this.options.RoadType[caseObj.RoadType]} ${caseObj.DName} ${caseObj.DistressName} ${this.options.DistressLevel[caseObj.DistressLevel]}` });
						else if(key == 'CaseProcess') {
							let content = "";

							// 主任分派
							if(!caseObj.DatePlan) content += "主任未分派、";
							else content += `主任 ${this.formatDate(caseObj.DatePlan)} 已分派、`;

							// 工班施工
							if(!caseObj.DateAssign) content += "工班未派施工、";
							else content += `工班 ${this.formatDate(caseObj.DateAssign)} 已派施工、`;

							// 已報完工
							if(!caseObj.DateClose) content += "未報完工、";
							else content += `${this.formatDate(caseObj.DateClose)} 已報完工、`

							// 補繪標線
							if(caseObj.IsMarking == 1 ) {
								content = content.replace(/、$/, "");
								content += "\n";
								if(caseObj.IsCancel_MK == 1) content += "補繪標線不需施作、";
								else if(caseObj.DateClose_MK) content += `補繪標線 ${this.formatDate(caseObj.DateClose_MK)} 已報完工、`;
								else if(caseObj.OrderSN_MK) content += `補繪標線 ${this.formatDate(caseObj.DateAssign_MK)} 已派施工、`;
								else if(caseObj.Contractor_MK) content += `補繪標線 ${this.formatDate(caseObj.DatePlan_MK)} 已分派、`;
								else content += "補繪標線 已提交、";
							}

							// TODO: 坑洞臨補
							// if(caseObj.SCType2Flag == "1") content += "坑洞臨補  ";
							// else if(caseObj.SCType2Flag == "2") content += "坑洞臨補已完工、";

							// TODO: 熱再生
							// if(caseObj.CType4 == "1") content += `熱再生主任已分派、`;
							// else if(caseObj.CType4 == "2") content += `熱再生 ${caseObj.CType4date} 已派施工、`;
							// else if(caseObj.CType4 == "3") content += `熱再生 ${caseObj.CType4date} 已派施工，熱再生 ${caseObj.page4t} 已完工、`;

							content = content.replace(/、$/, "");
							this.detail.push({ prop: key, column: this.headersDetailFilter[key].name, content });
						} else if(['DateCreate'].includes(key)) this.detail.push({ prop: key, column: this.headersDetailFilter[key].name, content: this.formatDate(caseObj[key]) }); 
						else if(key == 'Formula') {
							for (const col of ['MillingDepth', 'MillingLength', 'MillingWidth', 'MillingArea']) 
								if(Number(caseObj[col])) caseObj[col] = Math.round(caseObj[col] * 1000) / 1000;
							this.detail.push({ prop: key, column: this.headersDetailFilter[key].name, content: caseObj.MillingFormula != '0' ? `${caseObj.MillingFormula} = ${caseObj.MillingArea}` : `${caseObj.MillingLength}*${caseObj.MillingWidth} = ${caseObj.MillingArea}` });
						} else if(key == 'position') this.detail.push({ prop: key, column: this.headersDetailFilter[key].name, content: `(${caseObj.CoordinateX}, ${caseObj.CoordinateY})`, Coordinate: caseObj.Coordinate });
						else if(['paperkind', 'run1tflag'].includes(key)) this.detail.push({ prop: key, column: this.headersDetailFilter[key].name, content: this.options[key][caseObj[key]] });
						else if(['ImgZoomIn', 'ImgZoomOut'].includes(key)) this.detail.push({ prop: key, column: this.headersDetailFilter[key].name, content: [ caseObj[key]] });
						else if(key.endsWith("Img")) {
							if(caseObj[key] && caseObj[key].length > 0) this.detail.push({ prop: key, column: this.headersDetailFilter[key].name, content: caseObj[key] });
						} else this.detail.push({ prop: key, column: this.headersDetailFilter[key].name, content: caseObj[key] || "-" });
					}
					this.detail.push({ prop: "otherImage", column: "其他照片", content: "" });

					if([1, 2].includes(deviceType)) {
						for(const key in this.options.workmemo) {
							// console.log(`${key}Img`);
							// console.log(caseObj[`${key}Img`]);
							if(caseObj[`${key}Img`] && caseObj[`${key}Img`].length > 0) this.otherImage.push({ prop: key, column: this.options.workmemo[key], content: caseObj[`${key}Img`] });
						}
					}

					if(caseObj.hasOwnProperty("Image")) {
						for(const key in caseObj.Image) {
							const imgObj = this.options.restoredImgMap.filter(img => img.Id == key)[0];
							if(caseObj.Image[key] && caseObj.Image[key].length > 0) this.otherImage.push({ prop: imgObj.EngName, column: imgObj.ImgName, content: caseObj.Image[key] });
						}
					}
				}
				this.$emit('update:loading', false);
				this.$emit('update:showDetailDialog', true);
			}).catch(err => this.$emit('update:loading', false));
		},
		formatDate(time) {
			return moment(time).format("YYYY-MM-DD");
		},
	}
}
</script>

<style lang="sass">
.case-detail
	.el-table
		.el-table__expanded-cell
			padding: 0
			.el-table__header-wrapper
				display: none
	.btn-action
		display: inline-block
		margin-left: 5px
		padding: 5px
	.dialog-map
		min-height: 300px 
		.el-dialog__body
			height: 30%
	.img-preview
		width: 100%
		.el-image-viewer__mask
			opacity: 0.7
		.el-icon-circle-close
			color:  #FFF
</style>