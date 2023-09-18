<template>
	<div class="job-ticket-pdf">
		<el-button-group>
			<el-button type="success" icon="el-icon-s-claim" :disabled="tableSelect.length == 0" @click="previewPdf()">預覽</el-button>
			<el-button type="primary" icon="el-icon-download" :disabled="tableSelect.length == 0" @click="previewPdf(true)">製作</el-button>
		</el-button-group>

		<!-- Dialog: PDF預覽 -->
		<el-dialog class="pdf-preview" width="800px" :visible.sync="showJobTicket">
			<div ref="pdfViewer" />
			<div slot="footer" class="dialog-footer">
				<el-button size="small" @click="showJobTicket = false">取消</el-button>
				<el-button type="primary" size="small" @click="downloadPdf()">確定列印</el-button>
			</div>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);
import { generate } from '@pdfme/generator';
import { Viewer, BLANK_PDF } from '@pdfme/ui';

export default {
	name: "jobTicketPdf",
	components: { },
	props: {
		loading: {
			required: true,
			type: Boolean
		},
		tableSelect: {
			default: () => [],
			type: Array
		},
		deviceTypeNow: {
			required: true,
			type: Number
		},
		contractorNow: {
			required: true,
			type: Number
		},
		guildMap :{
			required: true,
			type: Object
		},
		deviceTypeMap: {
			required: true,
			type: Object
		}
	},
	data() {
		return {
			showJobTicket: true,
			pdfSetting: {
				format: 'a4',
				fontSize: 14,
				lineHeight: (14 + 2) * 0.35,
				AC: {
					orientation: 'p', //portrait
					pageSize: 8,
					imgTableSize: 4
				},
				HR: {
					orientation: 'l', //landscape
					pageSize: 5,
					imgTableSize: 5
				},
				FA: {
					orientation: 'p', //portrait
					pageSize: 4,
					imgTableSize: 4
				},
				MK: {
					orientation: 'l', //landscape
					pageSize: 5,
					imgTableSize: 5
				},
			}
		}
	},
	computed: {	},
	watch: {
		"pdfSetting.fontSize"() {
			this.pdfSetting.lineHeight = (this.pdfSetting.fontSize + 2) * 0.35;
		}
	},
	created() {
		this.imgDOMObj = {};

		// 讀入字型
		const readBlob = (blob) => {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onloadend = () => resolve(reader.result);
				reader.readAsDataURL(blob);
			});
		};

		fetch('/assets/font/edukai-4.0.ttf')
			// .then(res => res.arrayBuffer())
			// .then(arrayBuffer => window.btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte))));
			.then(res => res.blob())
			.then(async(blob) => { 
				this.viewer = new Viewer({ 
					domContainer: this.$refs.pdfViewer, 
					template: { 
						basePdf: BLANK_PDF,
						schemas: [{ }]
					},
					inputs: [{ }],
					options: {
						font:{
							edukai: {
								data: await blob.arrayBuffer(),
								fallback: true
							}
						}
					}
				});

				return readBlob(blob); 
			}).then(dataUri => dataUri.substr(dataUri.indexOf('base64,') + 7)).then(fontBString => {
				// console.log(fontBString);

				// init jsPDF
				this.pdfDoc = new jsPDF();
				this.pdfDoc.addFileToVFS("edukai.ttf", fontBString);
				this.pdfDoc.addFont("edukai.ttf", "edukai", "normal");
				this.pdfDoc.setFont("edukai");
			});
	},
	mounted() { 
		this.showJobTicket = false;
	},
	methods: {
		imgPreload(data) {
			//img preload
			this.imgDOMObj = {};
			data.forEach(l => { 
				let image = new Image();
				image.src = l.ImgZoomOut;
				this.imgDOMObj [l.CaseNo] = image;
			});
		},
		async createPdf() {
			return new Promise((resolve, reject) => {
				switch(this.deviceTypeNow) {
					case 1:
						this.createPdf_AC().then(() => resolve());
						break;
					case 2:
						this.createPdf_HR().then(() => resolve());
						break;
					case 3:
						this.createPdf_FA().then(() => resolve());
						break;
					case 4:
						this.createPdf_MK().then(() => resolve());
						break;
				}
			});
		},
		async createPdf_header(OrderSN = "          ") {
			return new Promise((resolve, reject) => {
				const { width, height } = this.pdfDoc.internal.pageSize;
				console.log(width, height);
				const contractor = this.guildMap[this.contractorNow];
				this.pdfDoc.setFontSize(this.pdfSetting.fontSize-4);
				this.pdfDoc.setTextColor('#999999');
				this.pdfDoc.text(`(廠商) ${contractor}`, 15, 10 );

				const subTitle = (this.deviceTypeNow == 1) ? "AC" : this.deviceTypeMap[this.deviceTypeNow];
				this.pdfDoc.setFontSize(this.pdfSetting.fontSize+4);
				this.pdfDoc.setTextColor('#000000');
				this.pdfDoc.setCharSpace(2);
				this.pdfDoc.text(`道路(${subTitle}) 維修派工單`, width / 2, 20, { align: 'center' });

				const today = `中華民國${moment().year()-1911}年${moment().format("MM年DD日")}`;
				this.pdfDoc.setFontSize(this.pdfSetting.fontSize);
				this.pdfDoc.setCharSpace(0);
				this.pdfDoc.text(`${today} 派工單號：  ${OrderSN}`, width - 15, this.pdfSetting.lineHeight + 25, { align: 'right' });
				// this.pdfDoc.text(`(預覽列印)`, width - 15, this.pdfSetting.lineHeight + 25, { align: 'right' });

				resolve();
			})
		},
		async createPdf_footer() {
			return new Promise((resolve, reject) => {
				const { width, height } = this.pdfDoc.internal.pageSize;

				// 頁數
				this.pdfDoc.setFontSize(this.pdfSetting.fontSize-2);
				for(let pageNo=1; pageNo <= this.pdfDoc.internal.getNumberOfPages(); pageNo++) {
					this.pdfDoc.setPage(pageNo); 
					this.pdfDoc.text(`${pageNo} of ${this.pdfDoc.internal.getNumberOfPages()}`, width/2, height-10, { align: 'center' } );
				}

				resolve();
			})
		},
		async createPdf_AC(OrderSN = "          ") {
			return new Promise(async (resolve, reject) => {
				// PDF排版
				let tonneSUM = 0;
				let areaSUM = 0;
				const splitTable = this.tableSelect.reduce((acc, cur) => {
					tonneSUM += cur.tonne;
					areaSUM += cur.MillingArea;
					if(acc[acc.length-1].length < this.pdfSetting.AC.pageSize) acc[acc.length-1].push(cur);
					else acc.push([cur]);
					return acc;
				}, [[]]);

				const tonneSUMHeader = tonneSUM;
				const areaSUMHeader = areaSUM;

				for(const [ pageIndex, table ] of splitTable.entries()) {
					this.pdfDoc.addPage(this.pdfSetting.format, this.pdfSetting.AC.orientation);
					while(pageIndex == 0 && this.pdfDoc.internal.getNumberOfPages() > 1) this.pdfDoc.deletePage(1);
					await this.createPdf_header(OrderSN);

					this.pdfDoc.autoTable({ 
						columns: [
							{ header: '總面積', dataKey: 'areaSUMTitle' },
							{ header: String(Math.floor(areaSUMHeader*10)/10), dataKey: 'areaSUMHeader' },
							{ header: '總噸數', dataKey: 'tonneSUMTitle' },
							{ header: String(Math.floor(tonneSUMHeader*10)/10), dataKey: 'tonneSUMHeader' },
						],
						theme: 'plain',
						styles: { font: "edukai", valign: 'middle', cellPadding: { top: 1, right: 0.8, bottom: 1, left: 0.8 }, lineWidth: 0.5 },
						headStyles: { halign: 'center' },
						columnStyles: {
							areaSUMTitle: { halign: 'center', cellWidth: 32 },
							areaSUM: { halign: 'center', cellWidth: 16 },
							tonneSUMTitle: { halign: 'center', cellWidth: 32 },
							tonneSUM: { halign: 'center', cellWidth: 16 }
						},
						startY:  this.pdfSetting.lineHeight * 2 + 25
					});

					this.pdfDoc.autoTable({ 
						// head: [[ '順序', '主任分派日期', '道管編號', '損壞類別', '維修地點', '算式', '面積', '深度', '頓數' ]],
						body: table.map((l, i) => ({ 
							order: (i+1) + this.pdfSetting.AC.pageSize*pageIndex, 
							// DatePlan: l.DatePlan, 
							CaseNo: l.CaseNo, 
							Postal_vil: l.Postal_vil,
							DistressName: l.DistressName, 
							Place: l.Place, 
							MillingFormula: (l.MillingFormula != '0') ? l.MillingFormula : `${l.MillingLength}*${l.MillingWidth}`, 
							MillingArea: l.MillingArea, 
							MillingDepth: l.MillingDepth,
							tonne: l.tonne,
							tonneRemain: Math.round((tonneSUM -= l.tonne)*10)/10
						})),
						columns: [
							{ header: '順序', dataKey: 'order' },
							// { header: '主任分派日', dataKey: 'DatePlan' },
							{ header: '道管編號', dataKey: 'CaseNo' },
							{ header: '里別', dataKey: 'Postal_vil' },
							{ header: '損壞類別', dataKey: 'DistressName' },
							{ header: '維修地點', dataKey: 'Place' },
							{ header: '預估算式', dataKey: 'MillingFormula' },
							{ header: '預估面積', dataKey: 'MillingArea' },
							{ header: '預估深度', dataKey: 'MillingDepth' },
							{ header: '噸數\n2.25', dataKey: 'tonne' },
							{ header: '剩餘噸數', dataKey: 'tonneRemain' },
							{ header: '實際算式', dataKey: 'acuMillingFormula' },
							{ header: '實際面積', dataKey: 'acuMillingArea' },
							{ header: '補繪標線', dataKey: 'marker' }
						],
						styles: { font: "edukai", valign: 'middle', fontSize: 9, cellPadding: { top: 1, right: 0.8, bottom: 1, left: 0.8 }, lineWidth: 0.2 },
						headStyles: { halign: 'center' },
						columnStyles: {
							order: { halign: 'center', cellWidth: 6 },
							// DatePlan: { halign: 'center', cellWidth: 24 },
							CaseNo: { halign: 'center', cellWidth: 22 },
							Postal_vil: { halign: 'center', cellWidth: 12 },
							DistressName: { halign: 'center', cellWidth: 10 },
							MillingFormula: { cellWidth: 26 },
							MillingArea: { halign: 'center', cellWidth: 10 },
							MillingDepth: { halign: 'center', cellWidth: 10 },
							tonne: { halign: 'center', cellWidth: 10 },
							tonneRemain: { halign: 'center', cellWidth: 10 },
							acuMillingFormula: { cellWidth: 16 },
							acuMillingArea: { halign: 'center', cellWidth: 10 },
							marker: { halign: 'center', cellWidth: 10 }
						},
						startY: this.pdfDoc.lastAutoTable.finalY + 2,
						rowPageBreak: 'avoid'
					});

					// this.pdfDoc.setLineDashPattern([2, 1], 0);
					// this.pdfDoc.setDrawColor('#999999');
					// this.pdfDoc.line( 10, this.pdfDoc.lastAutoTable.finalY + 10, width - 10, this.pdfDoc.lastAutoTable.finalY + 10);
					// this.pdfDoc.setLineDashPattern([0], 0);

					const splitImgTable = table.reduce((acc, cur) => {
						if(acc[acc.length-1].length < this.pdfSetting.AC.imgTableSize) acc[acc.length-1].push(cur);
						else acc.push([cur]);
						return acc;
					}, [[]]);

					for(const [imgIndex, imgTable] of splitImgTable.entries()) {
						// let startY = this.pdfDoc.lastAutoTable.finalY + 8 * Number(imgIndex == 0);
						// if(height - this.pdfDoc.lastAutoTable.finalY <= 70) startY = this.pdfDoc.lastAutoTable.finalY + 60;
						// console.log(startY);

						this.pdfDoc.autoTable({ 
							head: [ imgTable.map((l, i) => (`${(i+1) + this.pdfSetting.AC.imgTableSize*imgIndex + this.pdfSetting.AC.imgTableSize*2*pageIndex} - ${l.CaseNo}`)) ],
							// body: [ imgTable.map(l => l.ImgZoomOut) ],
							body: [ imgTable.map(l => l.CaseNo) ],
							theme: 'plain',
							styles: { font: "edukai", lineWidth: 0.2 },
							headStyles: { halign: 'center' },
							bodyStyles: { overflow: 'hidden', textColor: 255, cellWidth: 45, minCellHeight: 45, halign: 'center', valign: 'middle', fontSize: 1 }, 
							didDrawCell: async (data) => {
								if(data.cell.section === 'body') {
									// console.log(data);
									this.pdfDoc.addImage(this.imgDOMObj[data.cell.raw], 'JPEG', data.cell.x, data.cell.y, 45, 45);
								}
							},
							startY: this.pdfDoc.lastAutoTable.finalY + 8 * Number(imgIndex == 0),
							pageBreak: 'avoid'
						});
					}
				}

				await this.createPdf_footer();
				resolve();
			});
		},
		async createPdf_HR(OrderSN = "          ") {
			return new Promise(async (resolve, reject) => {
				// PDF排版
				const splitTable = this.tableSelect.reduce((acc, cur) => {
					if(acc[acc.length-1].length < this.pdfSetting.HR.pageSize) acc[acc.length-1].push(cur);
					else acc.push([cur]);
					return acc;
				}, [[]]);

				for(const [ pageIndex, table ] of splitTable.entries()) {
					this.pdfDoc.addPage(this.pdfSetting.format, this.pdfSetting.HR.orientation);
					while(pageIndex == 0 && this.pdfDoc.internal.getNumberOfPages() > 1) this.pdfDoc.deletePage(1);
					await this.createPdf_header(OrderSN);

					this.pdfDoc.autoTable({ 
						// head: [[ '順序', '主任分派日期', '道管編號', '損壞類別', '維修地點', '算式', '面積', '深度', '頓數' ]],
						body: table.map((l, i) => ({ 
							order: (i+1) + this.pdfSetting.HR.pageSize*pageIndex, 
							// DatePlan: l.DatePlan, 
							CaseNo: `${l.CaseNo}\n${l.CaseSN}`, 
							DistressName: l.DistressName,
							Place: `${l.Postal_vil}\n${l.Place}`,
							MillingFormula: (l.MillingFormula != '0') ? l.MillingFormula : `${l.MillingLength}*${l.MillingWidth}`, 
							MillingArea: l.MillingArea
						})),
						columns: [
							{ header: '順序', dataKey: 'order' },
							// { header: '主任分派日', dataKey: 'DatePlan' },
							{ header: '道管編號', dataKey: 'CaseNo' },
							{ header: '損壞類別', dataKey: 'DistressName' },
							{ header: '維修地點', dataKey: 'Place' },
							{ header: '預估算式', dataKey: 'MillingFormula' },
							{ header: '預估面積', dataKey: 'MillingArea' },
							{ header: '實際算式', dataKey: 'acuMillingFormula' },
							{ header: '實際面積', dataKey: 'acuMillingArea' },
							{ header: '補繪標線', dataKey: 'marker' }
						],
						styles: { font: "edukai", valign: 'middle', fontSize: 9, cellPadding: { top: 1, right: 0.8, bottom: 1, left: 0.8 }, lineWidth: 0.2 },
						headStyles: { halign: 'center' },
						columnStyles: {
							order: { halign: 'center', cellWidth: 6 },
							CaseNo: { halign: 'center', cellWidth: 26 },
							Place: { cellWidth: 26 },
							DistressName: { halign: 'center', cellWidth: 10 },
							MillingFormula: { cellWidth: 26 },
							MillingArea: { halign: 'center', cellWidth: 10 },
							// acuMillingFormula: { cellWidth: 16 },
							acuMillingArea: { halign: 'center', cellWidth: 10 },
							marker: { halign: 'center', cellWidth: 10 }
						},
						startY: this.pdfSetting.lineHeight * 2 + 25,
						rowPageBreak: 'avoid'
					});

					const splitImgTable = table.reduce((acc, cur) => {
						if(acc[acc.length-1].length < this.pdfSetting.HR.imgTableSize) acc[acc.length-1].push(cur);
						else acc.push([cur]);
						return acc;
					}, [[]]);

					for(const [imgIndex, imgTable] of splitImgTable.entries()) {
						this.pdfDoc.autoTable({ 
							head: [ imgTable.map((l, i) => (`${(i+1) + this.pdfSetting.HR.imgTableSize*imgIndex + this.pdfSetting.HR.imgTableSize*2*pageIndex} - ${l.CaseNo}`)) ],
							// body: [ imgTable.map(l => l.ImgZoomOut) ],
							body: [ imgTable.map(l => l.CaseNo) ],
							theme: 'plain',
							styles: { font: "edukai", lineWidth: 0.2 },
							headStyles: { halign: 'center' },
							bodyStyles: { overflow: 'hidden', textColor: 255, cellWidth: 45, minCellHeight: 45, halign: 'center', valign: 'middle', fontSize: 1 }, 
							didDrawCell: (data) => {
								if(data.cell.section === 'body') {
									// console.log(data);
									this.pdfDoc.addImage(this.imgDOMObj[data.cell.raw], 'JPEG', data.cell.x, data.cell.y, 45, 45);
								}
							},
							startY: this.pdfDoc.lastAutoTable.finalY + 8 * Number(imgIndex == 0),
							pageBreak: 'avoid'
						});
					}
				}

				await this.createPdf_footer();
				resolve();
			});
		},
		async createPdf_FA(OrderSN = "          ") {
			return new Promise(async (resolve, reject) => {
				// PDF排版
				const splitTable = this.tableSelect.reduce((acc, cur) => {
					if(acc[acc.length-1].length < this.pdfSetting.FA.pageSize) acc[acc.length-1].push(cur);
					else acc.push([cur]);
					return acc;
				}, [[]]);

				for(const [ pageIndex, table ] of splitTable.entries()) {
					this.pdfDoc.addPage(this.pdfSetting.format, this.pdfSetting.FA.orientation);
					while(pageIndex == 0 && this.pdfDoc.internal.getNumberOfPages() > 1) this.pdfDoc.deletePage(1);
					await this.createPdf_header(OrderSN);

					this.pdfDoc.autoTable({ 
						head: [[ 
							'順序', '道管編號', '維修地點',
							{ content: '日期項目', colSpan: 2 },
							{ content: '安全設施', colSpan: 2 }, 
							'工程概述', '補繪標線'
						]],
						body: table.map((l, i) => {
							const dateTitles = [ '案件逾期日', '主任分派日', '預計進場日', '實際完工日' ];
							const dateContents = [ 'DateDeadline', 'DatePlan' ]
							const safeTitles = [ '安全錐', '鐵板', '警示燈', '連桿' ]; 

							let rowArr = [];
							for(let j = 0; j < 4; j++) {
								let rowSpan = j == 0 ? 4 : 1;
								rowArr.push({ 
									order: { rowSpan, content: (i+1) + this.pdfSetting.FA.pageSize*pageIndex }, 
									// DatePlan: l.DatePlan, 
									CaseNo: { rowSpan, content: `${l.CaseNo}\n${l.CaseSN}` }, 
									Place: { rowSpan, content: `${l.Postal_vil}\n${l.Place}` },
									dateTitle: { content: dateTitles[j] },
									dateContent: { content: dateContents[j] != undefined ? l[dateContents[j]] : "" },
									safeTitle: { content: safeTitles[j] },
									Notes: { rowSpan, content: l.Notes },
									Marker:  { rowSpan, content: "" }
								})
							}
							return rowArr;
						}).flat(),
						columns: [
							{ header: '順序', dataKey: 'order' },
							// { header: '主任分派日', dataKey: 'DatePlan' },
							{ header: '道管編號', dataKey: 'CaseNo' },
							{ header: '維修地點', dataKey: 'Place' },
							{ header: '日期項目1', dataKey: 'dateTitle' },
							{ header: '日期項目2', dataKey: 'dateContent' },
							{ header: '安全設施1', dataKey: 'safeTitle' },
							{ header: '安全設施2', dataKey: 'safeContent' },
							{ header: '工程概述', dataKey: 'Notes' },
							{ header: '補繪標線', dataKey: 'Marker' }
						],
						styles: { font: "edukai", valign: 'middle', fontSize: 9, cellPadding: { top: 1, right: 0.8, bottom: 1, left: 0.8 }, lineWidth: 0.2 },
						headStyles: { halign: 'center' },
						columnStyles: {
							order: { halign: 'center', cellWidth: 6 },
							CaseNo: { halign: 'center', cellWidth: 26 },
							Place: { cellWidth: 26, minCellHeight: 18 },
							dateTitle: { halign: 'center', cellWidth: 18 },
							dateContent: { halign: 'center', cellWidth: 20 },
							safeTitle: { halign: 'center', cellWidth: 12 },
							safeContent: { halign: 'center', cellWidth: 10 },
							Marker: { halign: 'center', cellWidth: 10 }
						},
						startY: this.pdfSetting.lineHeight * 2 + 25,
						rowPageBreak: 'avoid'
					});

					// this.pdfDoc.setLineDashPattern([2, 1], 0);
					// this.pdfDoc.setDrawColor('#999999');
					// this.pdfDoc.line( 10, this.pdfDoc.lastAutoTable.finalY + 10, width - 10, this.pdfDoc.lastAutoTable.finalY + 10);
					// this.pdfDoc.setLineDashPattern([0], 0);

					const splitImgTable = table.reduce((acc, cur) => {
						if(acc[acc.length-1].length < this.pdfSetting.FA.imgTableSize) acc[acc.length-1].push(cur);
						else acc.push([cur]);
						return acc;
					}, [[]]);

					for(const [ imgIndex, imgTable ] of splitImgTable.entries()) {
						// let startY = this.pdfDoc.lastAutoTable.finalY + 8 * Number(imgIndex == 0);
						// if(height - this.pdfDoc.lastAutoTable.finalY <= 70) startY = this.pdfDoc.lastAutoTable.finalY + 60;
						// console.log(startY);

						this.pdfDoc.autoTable({ 
							head: [ imgTable.map((l, i) => (`${(i+1) + this.pdfSetting.FA.imgTableSize*imgIndex + this.pdfSetting.FA.imgTableSize*2*pageIndex} - ${l.CaseNo} \n ${l.Notes}`)) ],
							// body: [ imgTable.map(l => l.ImgZoomOut) ],
							body: [ imgTable.map(l => l.CaseNo) ],
							theme: 'plain',
							styles: { font: "edukai", lineWidth: 0.2 },
							headStyles: { halign: 'center' },
							bodyStyles: { overflow: 'hidden', textColor: 255, cellWidth: 45, minCellHeight: 45, halign: 'center', valign: 'middle', fontSize: 1 }, 
							didDrawCell: (data) => {
								if(data.cell.section === 'body') {
									// console.log(data);
									this.pdfDoc.addImage(this.imgDOMObj[data.cell.raw], 'JPEG', data.cell.x, data.cell.y, 45, 45);
								}
							},
							startY: this.pdfDoc.lastAutoTable.finalY + 8 * Number(imgIndex == 0),
							pageBreak: 'avoid'
						});
					}
				}

				await this.createPdf_footer();
				resolve();
			});
		},
		async createPdf_MK(OrderSN = "          ") {
			return new Promise(async (resolve, reject) => {
				// PDF排版
				const splitTable = this.tableSelect.reduce((acc, cur) => {
					if(acc[acc.length-1].length < this.pdfSetting.MK.pageSize) acc[acc.length-1].push(cur);
					else acc.push([cur]);
					return acc;
				}, [[]]);

				for(const [ pageIndex, table ] of splitTable.entries()) {
					this.pdfDoc.addPage(this.pdfSetting.format, this.pdfSetting.MK.orientation);
					while(pageIndex == 0 && this.pdfDoc.internal.getNumberOfPages() > 1) this.pdfDoc.deletePage(1);
					await this.createPdf_header(OrderSN);

					this.pdfDoc.autoTable({ 
						// head: [[ '順序', '主任分派日期', '道管編號', '損壞類別', '維修地點', '算式', '面積', '深度', '頓數' ]],
						body: table.map((l, i) => ({ 
							order: (i+1) + this.pdfSetting.MK.pageSize*pageIndex, 
							// DatePlan: l.DatePlan, 
							CaseNo: `${l.CaseNo}\n${l.CaseSN}`, 
							Place: `${l.Postal_vil}\n${l.Place}`,
							Note: l.IsCancel && l.IsCancel == 1 ? "不需施作" : "",
							areaSUM: ""
						})),
						columns: [
							{ header: '順序', dataKey: 'order' },
							// { header: '主任分派日', dataKey: 'DatePlan' },
							{ header: '道管編號', dataKey: 'CaseNo' },
							{ header: '維修地點', dataKey: 'Place' },
							{ header: '標線完成數量', dataKey: 'Note' },
							{ header: '總面積', dataKey: 'areaSUM' }
						],
						styles: { font: "edukai", valign: 'middle', fontSize: 9, cellPadding: { top: 1, right: 0.8, bottom: 1, left: 0.8 }, lineWidth: 0.2 },
						headStyles: { halign: 'center' },
						columnStyles: {
							order: { halign: 'center', cellWidth: 6 },
							CaseNo: { halign: 'center', cellWidth: 26 },
							Place: { cellWidth: 30, minCellHeight: 16 },
							areaSUM: { halign: 'center', cellWidth: 12 }
						},
						startY: this.pdfSetting.lineHeight * 2 + 25,
						rowPageBreak: 'avoid'
					});

					// this.pdfDoc.setLineDashPattern([2, 1], 0);
					// this.pdfDoc.setDrawColor('#999999');
					// this.pdfDoc.line( 10, this.pdfDoc.lastAutoTable.finalY + 10, width - 10, this.pdfDoc.lastAutoTable.finalY + 10);
					// this.pdfDoc.setLineDashPattern([0], 0);

					const splitImgTable = table.reduce((acc, cur) => {
						if(acc[acc.length-1].length < this.pdfSetting.MK.imgTableSize) acc[acc.length-1].push(cur);
						else acc.push([cur]);
						return acc;
					}, [[]]);

					for(const [imgIndex, imgTable] of splitImgTable.entries()) {
						// let startY = this.pdfDoc.lastAutoTable.finalY + 8 * Number(imgIndex == 0);
						// if(height - this.pdfDoc.lastAutoTable.finalY <= 70) startY = this.pdfDoc.lastAutoTable.finalY + 60;
						// console.log(startY);

						this.pdfDoc.autoTable({ 
							head: [ imgTable.map((l, i) => (`${(i+1) + this.pdfSetting.MK.imgTableSize*imgIndex + this.pdfSetting.MK.imgTableSize*2*pageIndex} - ${l.CaseNo}`)) ],
							// body: [ imgTable.map(l => l.ImgZoomOut) ],
							body: [ imgTable.map(l => l.CaseNo) ],
							theme: 'plain',
							styles: { font: "edukai", lineWidth: 0.2 },
							headStyles: { halign: 'center' },
							bodyStyles: { overflow: 'hidden', textColor: 255, cellWidth: 45, minCellHeight: 45, halign: 'center', valign: 'middle', fontSize: 1 }, 
							didDrawCell: (data) => {
								if(data.cell.section === 'body') {
									// console.log(data);
									this.pdfDoc.addImage(this.imgDOMObj[data.cell.raw], 'JPEG', data.cell.x, data.cell.y, 45, 45);
								}
							},
							startY: this.pdfDoc.lastAutoTable.finalY + 8 * Number(imgIndex == 0),
							pageBreak: 'avoid'
						});
					}
				}

				await this.createPdf_footer();
				resolve();
			});
		},
		previewPdf(isInstant = false) {
			this.$emit('update:loading', true);
			this.createPdf().then(() => {
				let orientation = '';
				switch(this.deviceTypeNow) {
					case 1:
						orientation = this.pdfSetting.AC.orientation;
						break;
					case 2:
						orientation = this.pdfSetting.HR.orientation;
						break;
					case 3:
						orientation = this.pdfSetting.FA.orientation;
						break;
					case 4:
						orientation = this.pdfSetting.MK.orientation;
						break;
				}
				
				const schemas = Array.from({ length: this.pdfDoc.internal.getNumberOfPages() }, () => (
					{
						"OrderSN": {
							"type": "text",
							"position": {
								"x": orientation == 'p' ? 168 : 255,
								"y": 26
							},
							"width": 27.24,
							"height": 6.12,
							"fontSize": 14,
							"alignment": "center"
						}
					}
				));

				this.viewer.updateTemplate({ basePdf: this.pdfDoc.output('bloburl'), schemas });

				if(isInstant) this.downloadPdf();
				else {
					this.viewer.setInputs([{ "OrderSN": "(預覽列印)" }]);

					this.$emit('update:loading', false);
					this.showJobTicket = true;	
				}
			})
		},
		downloadPdf() {
			this.$emit("downloadPdf", (orderSN) => {
				this.viewer.setInputs([{ "OrderSN": String(orderSN) }]);
				this.showJobTicket = false;
				this.handleDownload(`維修派工單_${orderSN}.pdf`);
				// this.pdfDoc.save(`維修派工單_${orderSN}.pdf`);
			});
		},
		handleDownload(filename) {
			generate({ template: this.viewer.getTemplate(), inputs: this.viewer.getInputs(), options: { font: this.viewer.getFont() } }).then(pdf => {
				// console.log(pdf);
				const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
				// window.open(URL.createObjectURL(blob));

				const file = new File([blob], filename, { type: 'application/pdf' });
				const link = document.createElement('a');
				const url = URL.createObjectURL(file);
				link.href = url;
				link.download = file.name;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(url);
			});
		},
	}
}
</script>

<style lang="sass">
.job-ticket-pdf
	.pdf-preview .el-dialog
		margin-top: 30px !important
		max-height: calc(100vh - 50px)
		.el-dialog__header, .el-dialog__body, .el-dialog__footer
			padding: 2px 10px
		.el-dialog__body > div > div
			max-height: calc(100vh - 100px)
		.el-dialog__footer
			position: absolute
			right: 5px
			bottom: 5px
</style>