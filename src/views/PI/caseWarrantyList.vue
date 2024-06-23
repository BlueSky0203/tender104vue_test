<template>
	<div class="app-container case-warranty-list" v-loading="loading">
		<h2>保固案件列表</h2>
		<div class="filter-container">
			<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1">
				<el-option v-for="(info, zip) in districtList" :key="zip" :label="info.name" :value="Number(zip)" />
			</el-select>
			<span class="filter-item">
				<el-select v-model="listQuery.filterType" class="filter-select" popper-class="type-select">
					<el-option label="保固日期(之後)" :value="1" />
					<el-option label="預計完工日期" :value="2" />
				</el-select>
				<el-date-picker v-if="listQuery.filterType == 1" v-model="date" type="date" placeholder="請選擇日期" :clearable="false" style="width: 180px" />
				<time-picker v-else-if="listQuery.filterType == 2" class="filter-item" :disabledDate="false" :hasWeek="false" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/>
			</span>
			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList()">搜尋</el-button>
			<el-button v-if="checkPermission(['PIcase.editor']) && tableSelect.length > 0" class="filter-item" :type="listQuery.filter ? 'success' : 'danger'" icon="el-icon-delete" @click="delCase(Number(listQuery.filter))">{{ listQuery.filter ? '恢復' : '刪除' }}</el-button>
			<el-checkbox v-if="checkPermission(['PIcase.editor'])" v-model="listQuery.filter" style="margin-left: 20px">已刪除</el-checkbox>

			<br>
			<el-radio-group v-model="listQuery.caseType" size="mini" @change="getList()">
				<el-radio-button :label="1">全部</el-radio-button>
				<el-radio-button :label="2">派工</el-radio-button>
				<el-radio-button :label="4">保固</el-radio-button>
			</el-radio-group>
			<el-button
				class="filter-item"
				type="info"
				icon="el-icon-document"
				@click="handleDownload"
			>輸出報表</el-button>

			<el-upload :class="[ 'filter-item', 'upload-csv', { 'is-ready' : csvFileList.length > 0 }]" ref="uploadFile" action accept=".csv" :multiple="false" :limit="1" :auto-upload="false" :file-list="csvFileList" :on-change="readCSV" :on-remove="handleRemove">
				<el-button type="success">上傳CSV</el-button>
			</el-upload>
			<transition name="el-fade-in">
				<el-button v-if="csvFileList.length > 0" type="success" @click="showCsvList = true">建立列表</el-button>
			</transition>
			<el-button type="text" @click="showDemo = true">CSV範例</el-button>

		</div>
		
		<h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5>

		<aside>
			<span v-if="this.list.length != 0"> 案件數: {{ this.list.length }} </span>
		</aside>
		
		<el-table
			:data="list"
			border
			:header-cell-style="{'background-color': '#F2F6FC'}"
			style="width: 100%"
			@selection-change="handleSelectionChange"
		>
			<el-table-column v-if="checkPermission(['PIcase.editor'])" type="selection" width="55" align="center" />
			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:sortable="value.sortable"
				:width="value.width"
			>
				<template slot-scope="{ row, column }">
					<span v-if="[ 'UploadCaseNo' ].includes(column.property)">
						<el-link v-if="row[column.property]" :href="`https://road.nco.taipei/RoadMis2/web/ViewDefectAllData.aspx?RDT_ID=${row[column.property]}`" target="_blank">{{ row[column.property] }}</el-link>
						<span v-else> - </span>
					</span>
					<span v-else>{{ formatter(row, column) }}</span>
				</template>
			</el-table-column>
		</el-table>

		<el-dialog
			:visible.sync="showCsvList"
			width="1150px"
			:close-on-click-modal="false"
			:close-on-press-escape="false"
			:show-close="false"
			center
		>	
			<span slot="title">匯入案件</span>
			<div class="filter-container">
				<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1">
					<el-option v-for="(info, zip) in districtList" :key="zip" :label="info.name" :value="Number(zip)" />
				</el-select>
				<el-upload :class="[ 'filter-item', 'upload-csv', { 'is-ready' : csvFileList.length > 0 }]" ref="uploadFile" action accept=".csv" :multiple="false" :limit="1" :auto-upload="false" :file-list="csvFileList" :on-change="readCSV" :on-remove="handleRemove">
					<!-- <i class="el-icon-upload" />
					<div class="el-upload__text">將CSV拖曳至此處，或<em>點此上傳</em></div> -->
					<el-button type="success">上傳CSV</el-button>
				</el-upload>
				<transition name="el-fade-in">
					<el-button v-if="csvFileList.length > 0" type="success" @click="createList()">案件上傳</el-button>
				</transition>
				<el-button @click="showCsvList = false; handleRemove();">取消</el-button>
			</div>

			<h3>案件數: {{ tableSelect.length }} / {{ csvData.length }} 件</h3>
			<el-table
				ref="caseTable"
				row-key="UploadCaseNo"
				empty-text="目前沒有資料"
				:data="csvData"
				border
				size="mini"
				fit
				highlight-current-row
				:header-cell-style="{'background-color': '#F2F6FC'}"
				stripe
				style="width: 100%"
				@selection-change="(selection) => tableSelect = selection"
			>
				<el-table-column type="selection" width="55" align="center" />
				<el-table-column
					v-for="(value, key) in headers"
					:key="key"
					:prop="key"
					:label="value.name"
					align="center"
					:width="[ 'DistressTypeR' ].includes(key) ? 140 : [ 'DeviceType', 'DateCompleted' ].includes(key) ? 90 : null"
					:formatter="formatter"
					:sortable="value.sortable"
					:show-overflow-tooltip="key == 'Place'"
				>
					<template slot-scope="{ row, column, $index }">
						<span v-if="[ 'UploadCaseNo' ].includes(column.property)">
							<el-link v-if="row[column.property]" :href="`https://road.nco.taipei/RoadMis2/web/ViewDefectAllData.aspx?RDT_ID=${row[column.property]}`" target="_blank" style="font-size: 12px">{{ row[column.property] }}</el-link>
							<span v-else> - </span>
						</span>
						<span v-else-if="[ 'DeviceType' ].includes(column.property)">
							<el-select v-model="row.DeviceType" placeholder="請選擇" size="mini" style="width: 50px" @change="updateDialogTable($index, row)">
								<el-option label="AC" value="AC" />
								<el-option label="設施" value="設施" />
							</el-select>
						</span>
						<span v-else-if="[ 'DistressTypeR' ].includes(column.property)">
							<el-select v-model="row.DistressTypeR" placeholder="請選擇" size="mini" style="width: 110px" @change="updateDialogTable($index, row)">
								<el-option v-for="type in distressType.filter(type => type != ((row.DeviceType == 'AC') ? '人行道' : '人孔高差'))" :key="type" :label="type" :value="type" />
							</el-select>
						</span>
						<span v-else-if="[ 'CaseType' ].includes(column.property)">
							<!-- <span>{{ row.CaseType }}</span> -->
							<el-checkbox-group v-model="row.CaseType" size="mini" @change="updateDialogTable($index, row)">
								<el-checkbox :label="2">派工</el-checkbox>
								<el-checkbox :label="4">保固</el-checkbox>
							</el-checkbox-group>
						</span>
						<span v-else-if="[ 'DateCompleted' ].includes(column.property)">
							<el-date-picker 
								class="datePicker" 
								v-model="row[column.property]"
								type="date" 
								placeholder="請選擇日期"
								value-format="yyyy/MM/dd"
								:format="formattedDate(row)"
								@input="updateDialogTable($index, row)" 
							/>
						</span>
						<span v-else>{{ formatter(row, column) }}</span>
					</template>
				</el-table-column>
			</el-table>
		</el-dialog>

		<el-dialog :visible.sync="showDemo" width="1110px" center>
			<div>保固案件_2303.csv (<el-link href="/demo/保固案件_2303.csv" target="_blank">下載<i class="el-icon-download" /></el-link>)</div>
			<br>
			<!-- <iframe width="100%" height="600" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vSENg_DyEurfd0ZDBFugZTBSTNyCJrUe2xxliAhrXYO4AIeHBpNkTjiQAmQgthjCLGZPxplxfF-xSAH/pubhtml?gid=1382937779&single=true&widget=false&headers=false&chrome=false" /> -->
			<iframe width="100%" height="600" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQIR-S3txWFFxXWq1Tds8utwDSs7JsYXnKqc4FOypDaxJ8ND1GuSINRK5nx5-hbeRfyY_NoGXXiR-G7/pubhtml?gid=1232250669&single=true&widget=false&headers=false&chrome=false" />
		</el-dialog>
	</div>
</template>
<script>
import moment from "moment";
import jschardet from "jschardet";
import iconv from "iconv-lite";
import { getCaseWarrantyList, addCaseWarrantyList, delCaseWarrantyList } from "@/api/PI";
import TimePicker from '@/components/TimePicker';
import checkPermission from '@/utils/permission';

export default {
	name: "caseWarrantyList",
	components: { TimePicker },
	data() {
		return {
			loading: false,
			timeTabId: 2,
			showCsvList: true,
			showDemo: false,
			dateRange: [ moment().subtract(1, 'month').startOf("month").toDate(), moment().subtract(1, 'month').endOf("month").toDate() ],
			date: moment().subtract(1, 'month').startOf("month").toDate(),
			searchRange: "",
			listQuery: {
				zipCode: 104,
				filterType: 1,
				filter: false,
				caseType: 4
			},
			headers: {
				UploadCaseNo: {
					name: "案件編號",
					sortable: false,
					width: 150
				},
				DistressSrc: {
					name: "查報來源",
					sortable: false
				},
				CaseDate: {
					name: "查報日期",
					sortable: false,
				},
				Place: {
					name: "查報地點",
					sortable: false,
					width: 400
				},
				DeviceType: {
					name: "設施類型",
					sortable: false
				},
				DistressType: {
					name: "損壞情形",
					sortable: false
				},
				DistressTypeR: {
					name: "缺失種類",
					sortable: false
				},
				DistressLevel: {
					name: "損壞狀況",
					sortable: false
				},
				CaseType: {
					name: "案件類型",
					sortable: false
				},
				DateDeadline: {
					name: "預計完工日期",
					sortable: false
				},
				DateCompleted: {
					name: "實際完工時間",
					sortable: false
				},
				DateWarranty: {
					name: "保固日期",
					sortable: false
				}
			},
			csvHeader: [ "案件編號", "查報日期", "查報地點", "預計完工日期", "實際完工時間", "損壞情形", "損壞狀況", "查報來源" ],
			apiHeader: [ "UploadCaseNo", "CaseDate", "Place", "State", "DeviceType", "DateDeadline", "DateCompleted", "DateWarranty", "DistressType", "DistressTypeR", "DistressLevel", "DistressSrc" ],
			tableSelect: [],
			list: [],
			csvData: [],
			csvFileList: [],
			districtList: {
				// 100: {
				// 	"name": "中正區",
				// },
				103: {
					"name": "大同區"
				},
				104: {
					"name": "中山區"
				},
				// 105: {
				// 	"name": "松山區"
				// },
				// 106: {
				// 	"name": "大安區"
				// },
				// 108: {
				// 	"name": "萬華區"
				// },
				// 110: {
				// 	"name": "信義區"
				// },
				// 111: {
				// 	"name": "士林區"
				// },
				// 112: {
				// 	"name": "北投區"
				// },
				// 114: {
				// 	"name": "內湖區"
				// },
				// 115: {
				// 	"name": "南港區"
				// },
				// 116: {
				// 	"name": "文山區"
				// }
			},
			distressType: ['坑洞', '人孔高差', '縱橫向裂縫/龜裂', '車轍/隆起與凹陷', '人行道', '其他'],
			checkDateWarranty:true,
		};
	},
	mounted() {
		this.showCsvList = false;
	},
	methods: {
		checkPermission,
		getList() {
			this.loading = true;
			let startDate = '';
			let endDate = '';

			if(this.listQuery.filterType == 1) startDate = moment(this.date).format("YYYY-MM-DD");
			else if(this.listQuery.filterType == 2) {
				startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
				endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			}		
			this.searchRange = startDate + " - " + endDate;

			this.list = [];
			getCaseWarrantyList({
				zipCode: this.listQuery.zipCode,
				caseType: this.listQuery.caseType,
				filter: this.listQuery.filter,
				filterType: this.listQuery.filterType,
				timeStart: startDate,
				timeEnd: (this.listQuery.filterType == 1) ? '' : moment(endDate).add(1, "d").format("YYYY-MM-DD")
			}).then((response) => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.list = response.data.list;
					this.list.forEach(l => {
						if(l.State & 1) l.CaseType = "-";
						if((l.State & 1) && (l.State & 2)) l.CaseType = "派工"; 
						if((l.State & 1) && (l.State & 2) && (l.State & 4)) l.CaseType = "保固"; 
					});
					// console.log(this.list)
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		createList() {
			this.loading = true;
			const arr = this.tableSelect.map((val)=>{val.DateWarranty});
			this.checkDateWarranty=!arr.includes("Invalid date")
			if(this.checkDateWarranty){
				this.tableSelect.forEach(l => l.State = l.CaseType.reduce((acc, cur) => (acc +=cur)));
				const caseList = JSON.parse(JSON.stringify(this.caseFilterList(this.tableSelect)));
				caseList.forEach(caseSpec => {
					caseSpec.CaseDate = moment(caseSpec.CaseDate).isValid() ? moment(caseSpec.CaseDate).utc().format("YYYY/MM/DD HH:mm:ss") : "";
					caseSpec.DateDeadline = moment(caseSpec.DateDeadline).isValid() ? moment(caseSpec.DateDeadline).utc().format("YYYY/MM/DD HH:mm:ss") : "";
					caseSpec.DateCompleted = moment(caseSpec.DateCompleted).isValid() ? moment(caseSpec.DateCompleted).utc().format("YYYY/MM/DD HH:mm:ss") : "";
					caseSpec.DateWarranty = moment(caseSpec.DateWarranty).isValid() ? moment(caseSpec.DateWarranty).utc().format("YYYY/MM/DD HH:mm:ss") : "";
				})
				
				addCaseWarrantyList({
					zipCode: this.listQuery.zipCode,
					caseList
				}).then(response =>{
					console.log(response);
					if ( response.statusCode == 20000 ) {
						this.$message({
							message: "建立成功",
							type: "success",
						});

						this.handleRemove()
						this.showCsvList = false
					} 
				}).catch(err=>{
					console.log(err);
				})
			}else{
				this.$message({
						message: "保固日期異常",
						type: "warning",
				});
			}
		},
		delCase(opType) {
			this.$confirm(`確定${opType == 1 ? '恢復' : '刪除'} ${this.tableSelect.length}件案件?`, "確認", { showClose: false }).then(() => {
				delCaseWarrantyList({
					opType,
					CNList: this.tableSelect.map(row => row.UploadCaseNo)
				}).then(response => {
					if ( response.statusCode == 20000 ) {
						this.$message({
							message: `${opType == 1 ? '恢復' : '刪除'}成功`,
							type: "success",
						});
						this.getList();
					} 
				}).catch(err => {
					console.log(err);
					this.getList();
				})
			})
		},
		handleSelectionChange(value) {
			this.tableSelect = value;
		},
		caseFilterList(list) {
			let caseFilterList = [];
			for(const row of list) {
				let caseItem = {};
				for(const key of this.apiHeader) caseItem[key] = row[key];
				caseFilterList.push(caseItem);
			}

			return caseFilterList;
		},
		formatter(row, column) {
			if(column.property.indexOf('Date') != -1) return row[column.property] ? this.formatTime(row[column.property]) : "-";
			else return row[column.property] && row[column.property] != '0' ? row[column.property] : "-";
		},
		formatTime(time) {
			if(time == "Invalid date"){
				return
			}else{
				const formatTime = moment(time).format("YYYY/MM/DD").split("/");
				formatTime[0] = Number(formatTime[0]) - 1911;
				return formatTime.join("/");
			}
		},
		readCSV(file, fileList) {
			if(fileList.length > 1) fileList.shift();
			this.csvFileList = JSON.parse(JSON.stringify(fileList));
			this.tableSelect = [];

			if(file.raw.type != "text/csv") {
				this.$message({
					type: "warning",
					message: "文件類型不符，請重新上傳正確csv"
				});
				this.handleRemove(); 
			} else {
				this.loading = true;
				let reader = new FileReader();
				// reader.readAsText(file.raw, "UTF-8");
				reader.readAsArrayBuffer(file.raw);
				reader.onload = (evt) => {
					// 讀取CSV內容
					// const fileString = evt.target.result;
					const buffer = Buffer.from(evt.target.result);
					const type = jschardet.detect(buffer);
					// console.log(type);
					const fileString = iconv.decode(buffer, type.encoding);

					//轉成array
					this.csvData = this.csvToArray(fileString);
					// console.log(this.csvData);
					this.checkCsv();
					this.selectedRows();
				}
			}
		},
		checkCsv() {
			const fileHeaders = Object.keys(this.csvData[0]);
			let lackHeaderList = [];
			for(const header of this.csvHeader) {
				if(!fileHeaders.includes(header)) lackHeaderList.push(header);
			}

			if(lackHeaderList.length != 0) {
				this.$message({
					type: "warning",
					message: `csv缺少欄位${lackHeaderList.map(l => `「${l}」`).join("、")}，請重新上傳正確csv`
				});
				this.handleRemove(); 
			} else {
				this.csvData.forEach(data => {
					Object.keys(data).forEach(oldKey => {
						const newKeyArr = Object.keys(this.headers).filter(key => this.headers[key].name == oldKey);
						if(newKeyArr.length != 0) data[newKeyArr[0]] = data[oldKey];
						delete data[oldKey];
					});

					data.CaseType = [1];

					if(['坑洞', '其他'].includes(data.DistressType)) data.DistressTypeR = data.DistressType;

					if(['鋪面破損', '孔蓋周邊破損', '樹穴緣石', '側溝蓋破損',  '溝蓋路邊緣石', '鋪面鬆動'].includes(data.DistressType)) {
						data.DeviceType = '設施';
						data.DistressTypeR = '人行道'
					} else {
						data.DeviceType = 'AC';
						if(['人手孔缺失'].includes(data.DistressType)) data.DistressTypeR = '人孔高差';
						else if(['縱向及橫向裂縫', '龜裂'].includes(data.DistressType)) data.DistressTypeR = '縱橫向裂縫/龜裂';
						else if(['車轍', '隆起與凹陷'].includes(data.DistressType)) data.DistressTypeR = '車轍/隆起與凹陷';
					}

					// 計算保固日期
					// this.computedWarranty(data);
				});
				// this.computedDateWarranty();
				// this.$refs.caseTable.toggleAllSelection();
				this.showCsvList = true;
			}
		},
		csvToArray(str, delimiter = ",") {
			str = str.replace(/\"(.*)[\r\n|\n](.*)\"/g, "$1$2");
			const headers = str.slice(0, str.indexOf("\n")).split(delimiter).map(header => header.replace(/\r\n/g,'').trim());
			const rows = str.slice(str.indexOf("\n") + 1).split("\n").filter(row => row.length != 0);
			const regex = /("[^"]+"|[^,]+)*,/g;

			const result = rows.map(row => {
				const values = row.split(regex).filter(row => row == undefined || row.length != 0).map(row => {
					if(row == undefined) return row = '';
					else return row.replace(/\r\n|\"/g,'').trim();
				});

				return headers.reduce((object, header, index) => {
					if([ "查報日期", "預計完工日期", "實際完工時間" ].includes(header)){
						if(values[index]=="") object[header] = ""
						else {
							const dateArr = values[index].split("/");
							object[header] = `${Number(dateArr[0])+1911}/${dateArr[1]}/${dateArr[2]}`;
						}
					} 
					else{
						object[header] = values[index]; 
					} 
					return object
				}, {});
			});	

			return result
		},
		selectedRows(){
			const selectedRows = [];
			this.csvData.forEach(data => {
				if (data.DateWarranty !== "Invalid date") {
					selectedRows.push(data);
				}
			});
			//不勾選保固日期異常者
			this.$nextTick(() => {
				for (let i = 0; i < selectedRows.length; i++) {
					this.$refs.caseTable.toggleRowSelection(selectedRows[i], true);
				}
			});	
		},
		//案件上傳之日期選擇器相關方法
		formattedDate(row){
			const formatTime = moment(row.DateCompleted).format("YYYY/MM/DD").split("/");
			formatTime[0] = Number(formatTime[0]) - 1911;
			return formatTime.join("/");
		},
		computedWarranty(row){
			if(['坑洞', '人孔高差'].includes(row.DistressType)) row.DateWarranty = moment(row.DateCompleted).add(13, 'day').format("YYYY/MM/DD");
			else row.DateWarranty = moment(row.DateCompleted).add(179, 'day').format("YYYY/MM/DD");
		},
		updateDialogTable(index, row) {
			if(row.CaseType.includes(4) && !row.CaseType.includes(2)) row.CaseType.push(2);
			row.State = row.CaseType.reduce((acc, cur) => (acc += cur));
			if(row.State & 4) this.computedWarranty(row);
			else delete row.DateWarranty;
			this.$set(this.csvData, index, row);
		},
		handleRemove(file, fileList) {
			this.csvData = [];
			if(fileList == undefined) this.csvFileList = [];
			else this.csvFileList = JSON.parse(JSON.stringify(fileList));
			this.$refs.uploadFile.clearFiles();
			// this.getList();
			this.loading = false;
		},
		handleDownload() {
			let headersObj = Object.values(this.headers);
			let tHeader = []
			headersObj.forEach(element => {
				tHeader.push(element.name)
			});
			// console.log(tHeader)
			let filterVal = Object.keys(this.headers);
			let data = this.formatJson(filterVal, this.list);

			import("@/vendor/Export2Excel").then((excel) => {
				excel.export_json_to_excel({
					header: tHeader,
					data,
				});
			});
		},
		formatJson(filterVal, jsonData) {
			return jsonData.map((v) => filterVal.map((j) => {
				if(j.indexOf('Date') != -1) return v[j] ? this.formatTime(v[j]) : "-";
				else return v[j] && v[j] != '0' ? v[j] : "-";
			}));
			
		},
	},
};
</script>

<style lang="sass">
.case-warranty-list
	.filter-container 
		.el-select
			width: 110px
		.el-input__inner
			padding-left: 5px
			text-align: center
		.filter-select 
			width: 130px
			.el-input__inner
				background-color: #F5F7FA
				color: #909399
				border-right: none
				border-top-right-radius: 0
				border-bottom-right-radius: 0
				&:focus
					border-color: #DCDFE6
		.upload-csv
			display: inline-flex
			// flex-direction: row-reverse
			border: 1px solid rgba(#909399, 0.6)
			border-radius: 5px
			&.is-ready > .el-upload.el-upload--text
				display: none
			.el-upload-list__item
				transition: none !important
				margin-top: 0
				.el-upload-list__item-name
					line-height: 35px
					margin: 0 25px 0 10px
				.el-icon-close
					display: block
					top: 50%
					transform: translateY(-50%)
					color: #F56C6C
					font-weight: bold
					&:hover
						color: white
						background-color: #F56C6C
						border-radius: 50%
	.el-dialog
		.el-dialog__body > div
			margin-top: 10px
			.el-select
				.el-input__inner
					padding: 0 15px 0 5px
				.el-select__caret.el-input__icon.el-icon-arrow-up
					width: 14px
					font-size: 10px
			.el-checkbox
				margin-right: 0
				margin-top: -5px
				.el-checkbox__label
					font-size: 12px
			.datePicker
				font-size: 12px
				width: 80px
				.el-input__inner
					width: 70px
					height: 30px
					padding:0 0 0 5px
				.el-input__icon
					display: none

</style>