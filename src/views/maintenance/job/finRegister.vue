<template>
	<div class="app-container finish-register" v-loading="loading">
		<h2>完工登錄</h2>
		<div class="filter-container">
			<div class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>類型</span>
					</div>
					<el-select v-model.number="listQuery.deviceType" placeholder="請選擇" popper-class="type-select" style="width: 100px">
						<el-option v-for="(name, id) in options.deviceType" :key="id" :value="Number(id)" :label="name" />
					</el-select>
				</div>
			</div>
			<div class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>廠商</span>
					</div>
					<el-select v-model.number="listQuery.contractor" placeholder="請選擇" popper-class="type-select" style="width: 100px">
						<el-option v-for="(name, id) in options.guildMap" :key="id" :value="Number(id)" :label="name" />
					</el-select>
				</div>
			</div>
			<br>

			<div class="filter-item">
				<el-input v-model="listQuery.filterStr" placeholder="請輸入" style="width: 300px" >
					<span slot="prepend">派工單號</span>
				</el-input>
			</div>
			
			<!-- <div class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>合約</span>
					</div>
					<el-select v-model="listQuery.tenderId" class="tender-select" placeholder="請選擇" popper-class="type-select tender">
						<el-option v-for="(obj, id) in options.tenderMap" :key="id" :value="id" :label="obj.tenderName" />
					</el-select>
				</div>
			</div> -->

			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList();">搜尋</el-button>
			<!-- <el-button class="filter-item" type="info" icon="el-icon-document" :circle="screenWidth < 567" @click="handleDownload">輸出列表</el-button> --> 
		</div>

		<!-- <h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5> -->
		<div v-if="list.length != 0" style="width: 300px; margin: 5px 5px 15px 10px;">
			<el-row v-if="list[0].DateClose.length != 0" :gutter="20">
				<el-col :span="12">完工登錄日期: </el-col>
				<el-col :span="12">{{ list[0].DateClose }}</el-col>
			</el-row>
			<el-row v-if="deviceTypeNow == 1" :gutter="20">
				<el-col :span="6">總面積: </el-col>
				<el-col :span="5">{{ Math.round(caseSum.areaSUM*10)/10 }}</el-col>
				<el-col :span="2" />
				<el-col :span="6">總噸數: </el-col>
				<el-col :span="5">{{ Math.round(caseSum.tonneSUM*10)/10 }}</el-col>
			</el-row>
		</div>

		<el-table
			ref="caseTable"
			empty-text="目前沒有資料"
			:data="list"
			:key="deviceTypeNow"
			border
			fit
			:row-class-name="tableRowClassName"
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			style="width: 100%"
		>
			<el-table-column label="順序" prop="OrderIndex" width="50" align="center" fixed />
			<el-table-column v-if="!isAllCompleted" label="退回" width="120" align="center" fixed>
				<template slot-scope="{ row }">
					<span v-if="(deviceTypeNow == 4 && row.IsCancel) || row.edit"> - </span>
					<el-button-group v-else>
						<el-button v-if="deviceTypeNow != 4 || row.DeviceType == 4" type="danger" size="mini" style="padding: 5px" @click="beforeRemove(row, 1)">主任</el-button>
						<el-button type="warning" size="mini" style="padding: 5px" @click="beforeRemove(row, 2)">派工</el-button>
					</el-button-group>
				</template>
			</el-table-column>

			<!-- <el-table-column prop="OrderSN" label="派工單號" width="125" align="center" fixed sortable /> -->
			<el-table-column prop="CaseNo" label="案件編號" width="125" align="center" fixed sortable>
				<template slot-scope="{ row }">
					<span>{{ row.CaseSN }}</span>
					<br>
					<span>{{ row.CaseNo }}</span>
					<br>
					<span style="color: #909399; font-size: 12px">{{ row.DName }} ({{ row.casetype }})</span>
				</template>
			</el-table-column>

			<el-table-column
				v-for="(value, key) in headersFilter"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:min-width="['Place'].includes(key) ? 80 : null"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="[ 'IsMarking' ].includes(column.property)">
						<span v-if="row.IsCancel_MK == 1" style="color: #F56C6C">不需施作</span>
						<span v-else-if="row.IsMarkingNow == 1 && row.DateClose_MK">{{ formatTime(row.DateClose_MK) }}完工</span>
						<span v-else-if="row.IsMarkingNow == 1 && row.OrderSN_MK">派工單{{ row.OrderSN_MK }}</span>
						<span v-else-if="row.IsMarkingNow == 1 && row.Contractor_MK">已分派</span>
						<el-checkbox v-else-if="row.edit && !isAllCompleted" v-model="row[column.property]" :true-label='1' :false-label='0' />
						<span v-else-if="row.IsMarkingNow == 1"><i class="el-icon-check" style="color: #67C23A" /></span>
						<span v-else> - </span>
					</span>
					<span v-else>
						<span>{{ row[column.property] || "-" }}</span>
					</span>
				</template>
			</el-table-column>

			<!-- 道路、熱再生 -->
			<el-table-column v-if="[1,2].includes(deviceTypeNow)" label="算式" width="255" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.edit">
						<el-row v-if="row.editFormula" :gutter="5" type="flex" align="middle">
							<el-col :span="4"><el-tag class="btn-tag" type="success" @click="row.editFormula = false; calArea(row);">自訂</el-tag></el-col>
							<el-col :span="20"><el-input v-model="row.MillingFormula" @change="calArea(row)" /></el-col>
						</el-row>
						<el-row v-else :gutter="5" type="flex" align="middle">
							<el-col :span="4"><el-tag class="btn-tag" @click="row.editFormula = true; calArea(row);">簡單</el-tag></el-col>
							<el-col :span="8"><el-input v-model="row.MillingLength" @change="calArea(row)" /></el-col>
							<el-col :span="2" style="line-height: 36px"> ✕ </el-col>
							<el-col :span="8"><el-input v-model="row.MillingWidth" @change="calArea(row)" /></el-col>
						</el-row>
					</span>
					<span v-else>
						<span v-if="row.MillingFormula != '0'">{{ row.MillingFormula }}</span>
						<span v-else>{{ row.MillingLength }} * {{ row.MillingWidth }}</span>
					</span>
				</template>
			</el-table-column>
			<el-table-column v-if="[1,2].includes(deviceTypeNow)" label="面積" width="60" align="center">
				<template slot-scope="{ row }">
					<!-- <el-input v-model="row.MillingArea" /> -->
					<span>{{ row.MillingArea || "-" }}</span>
				</template>
			</el-table-column>
			<el-table-column v-if="[1,2].includes(deviceTypeNow)" label="完工備註" width="227" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.edit">
						<el-row v-for="key in options.workmemoOrder.filter(key => key != 'uNotes')" :gutter="5" :key="key">
							<el-col :span="6" style="line-height: 32px">{{ options.workmemo[key] }}</el-col>
							<el-col :span="16">
								<el-input v-model.number="row[key]" size="mini">
									<el-button slot="append" style="padding: 5px 10px" @click="beforeMImgEdit(row, key)">上傳照片 ({{ row[`${key}Img`].length }})</el-button>
								</el-input>
							</el-col>
						</el-row>
						<el-row :gutter="5">
							<el-col :span="6" style="line-height: 32px">{{ options.workmemo.uNotes }}</el-col>
							<el-col :span="18">
								<el-input v-model="row.uNotes" size="mini" />
							</el-col>
						</el-row>
					</span>
					<el-row :gutter="5" v-else>
						<span v-if="options.workmemoOrder.filter(key => row.uNotes.length > 0 || (key != 'uNotes' && row[key] != 0)).length != 0">
							<el-row :gutter="5">
								<span v-for="key in options.workmemoOrder.filter(key => key != 'uNotes' && row[key] != 0)" :key="key">
									<el-col :span="6">{{ options.workmemo[key] }}</el-col>
									<el-col :span="6" class="item-content">{{ row[key] }} (
										<span v-if="row[`${key}Img`].length > 0">
											<el-popover v-if="row[`${key}Img`].length > 0" popper-class="imgHover" placement="top" trigger="hover">
												<div v-for="(imgSpec, index) of row[`${key}Img`]" :key="`img_${index}`">
													<el-image style="max-width: 200px" :src="imgSpec.url" fit="scale-down" />
												</div>
												<span slot="reference">
													<i  class="el-icon-picture" style="color: #409EFF" />{{ row[`${key}Img`].length }}
												</span>
											</el-popover>
										</span>
										<span v-else><i class="el-icon-picture" style="color: #F56C6C" />{{ row[`${key}Img`].length }}</span>)
									</el-col>
								</span>
							</el-row>
							<el-row v-if="row.uNotes && row.uNotes.length != 0" :gutter="5">
								<el-col :span="6">{{ options.workmemo.uNotes }}</el-col>
								<el-col :span="18" class="item-content">{{ row.uNotes }}</el-col>
							</el-row>
						</span>
						<span v-else> - </span>
					</el-row>
				</template>
			</el-table-column>

			<!-- 道路 -->
			<el-table-column v-if="deviceTypeNow == '1'" label="刨鋪深度" width="53" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.edit">
						<el-select v-model="row.MillingDepth" size="mini" popper-class="type-select">
							<el-option v-for="value in options.depthArr" :key="value" :label="value" :value="value"/>
						</el-select>
					</span>
					<span v-else>{{ row.MillingDepth }}</span>
				</template>
			</el-table-column>
			<el-table-column v-if="deviceTypeNow == '1'" label="使用粒料" width="220" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.edit">
						<el-row :gutter="5">
							<el-col :span="7" style="line-height: 28px">粒料3/4</el-col>
							<el-col :span="5">
								<el-select v-model="row.Aggregate34" size="mini" popper-class="type-select">
									<el-option v-for="value in options.depthArr" :key="value" :label="value" :value="value"/>
								</el-select>
							</el-col>
							<el-col :span="7" style="line-height: 28px">粒料3/8</el-col>
							<el-col :span="5">
								<el-select v-model="row.Aggregate38" size="mini" popper-class="type-select">
									<el-option v-for="value in options.depthArr" :key="value" :label="value" :value="value"/>
								</el-select>
							</el-col>
						</el-row>
						<hr>
						<el-checkbox v-model="row.SamplingL1" :true-label="1" :false-label="0">一級抽料</el-checkbox>
						<el-row :gutter="5">
							<el-col :span="8">
								<el-select v-model="row.SamplingL1Detail.Aggregate" size="mini" popper-class="type-select" :disabled="row.SamplingL1 == 0">
									<el-option v-for="(value, type) in options.sampling.typeMap" :key="type" :label="value" :value="type"/>
								</el-select>
							</el-col>
							<el-col :span="8">
								<el-input v-model="row.SamplingL1Detail.Amount" size="mini" :disabled="row.SamplingL1 == 0" />
							</el-col>
							<el-col :span="8">
								<el-select v-model="row.SamplingL1Detail.Unit" size="mini" popper-class="type-select" :disabled="row.SamplingL1 == 0">
									<el-option v-for="value in options.sampling.unitArr" :key="value" :label="value" :value="value"/>
								</el-select>
							</el-col>
						</el-row>
						<el-checkbox v-model="row.SamplingL2" :true-label="1" :false-label="0">二級抽料</el-checkbox>
						<el-row :gutter="5">
							<el-col :span="8">
								<el-select v-model="row.SamplingL2Detail.Aggregate" size="mini" popper-class="type-select" :disabled="row.SamplingL2 == 0">
									<el-option v-for="(value, type) in options.sampling.typeMap" :key="type" :label="value" :value="type"/>
								</el-select>
							</el-col>
							<el-col :span="8">
								<el-input v-model="row.SamplingL2Detail.Amount" size="mini" :disabled="row.SamplingL2 == 0" />
							</el-col>
							<el-col :span="8">
								<el-select v-model="row.SamplingL2Detail.Unit" size="mini" popper-class="type-select" :disabled="row.SamplingL2 == 0">
									<el-option v-for="value in options.sampling.unitArr" :key="value" :label="value" :value="value"/>
								</el-select>
							</el-col>
						</el-row>
					</span>
					<span v-else>
						<el-row :gutter="5">
							<el-col :span="8">粒料3/4: </el-col>
							<el-col :span="3" class="item-content">{{ row.Aggregate34 }}</el-col>
							<el-col :span="2" class="item-content"> | </el-col>
							<el-col :span="8">粒料3/8: </el-col>
							<el-col :span="3" class="item-content">{{ row.Aggregate38 }}</el-col>
						</el-row>

						<hr v-if="row.SamplingL1 || row.SamplingL2">

						<el-row :gutter="5" v-if="row.SamplingL1">
							<el-col :span="8" :offset="2">一級抽料: </el-col>
							<el-col :span="6">{{ options.sampling.typeMap[row.SamplingL1Detail.Aggregate] }}</el-col>
							<el-col :span="6"><span class="item-content">{{ row.SamplingL1Detail.Amount }}</span> {{ row.SamplingL1Detail.Unit }}</el-col>
						</el-row>

						<el-row :gutter="5" v-if="row.SamplingL2">
							<el-col :span="8" :offset="2">二級抽料: </el-col>
							<el-col :span="6">{{ options.sampling.typeMap[row.SamplingL2Detail.Aggregate] }}</el-col>
							<el-col :span="6"><span class="item-content">{{ row.SamplingL2Detail.Amount }}</span> {{ row.SamplingL2Detail.Unit }}</el-col>
						</el-row>
					</span>
				</template>
			</el-table-column>

			<!-- 設施 -->
			<el-table-column v-if="deviceTypeNow == 3" label="急件" width="55" align="center">
				<template slot-scope="{ row }">
					<i v-if="row.IsPressing == 1" class="el-icon-check" style="color: #67C23A; font-weight: bold;" />
					<span v-else> - </span>
				</template>
			</el-table-column>
			<el-table-column v-if="deviceTypeNow == 3" label="工程概述" align="center">
				<template slot-scope="{ row }">
					<el-input v-if="row.edit" v-model="row.Notes" />
					<span v-else>{{ row.Notes || " - " }}</span>
				</template>
			</el-table-column>

			<!-- 標線 -->
			<el-table-column v-if="deviceTypeNow == 4" label="面積" width="80" align="center">
				<template slot-scope="{ row }">
					<!-- <el-input v-model="row.MillingArea" size="mini" /> -->
					<span>{{ row.MillingArea || "-" }}</span>
				</template>
			</el-table-column>

			<!-- 設施、標線 -->
			<el-table-column v-if="[3,4].includes(deviceTypeNow)" label="實際數量" width="140" align="center">
				<template slot-scope="{ row }">
					<span v-if="deviceTypeNow == 4 && row.IsCancel" style="color: #F56C6C">不需施作</span>
					<el-button-group v-else-if="!row.edit">
						<el-button v-if="!isAllCompleted" :type="row.DateRecord == null && row.TaskRealGroup == row.TaskRealGroup_Plan ? 'success' : 'info'" :plain="!row.Content.length != 0" size="mini" @click="beforeEdit(row)">登錄</el-button>
						<el-button size="mini" @click="toggleExpand(row)">詳情</el-button>
					</el-button-group>
					<span v-else> - </span>
				</template>
			</el-table-column>
			
			<el-table-column label="動作" align="center">
				<template slot-scope="{ row }">
					<el-button-group v-if="!row.edit">
						<el-button v-if="!isAllCompleted" type="success" plain size="mini" @click="beforeImgEdit(row)">照片</el-button>
						<!-- <el-button v-if="!isAllCompleted && [3,4].includes(deviceTypeNow)" type="primary" size="mini" @click="beforeEdit(row)">數量</el-button> -->
						<el-button v-if="!isAllCompleted && deviceTypeNow != 4" type="primary" size="mini" @click="row.edit = true">編輯</el-button>
						<el-button v-if="!isAllCompleted && deviceTypeNow == 4" :type="row.IsCancel ? 'success' : 'danger'" size="mini" plain @click="finishCancel(row, Number(!row.IsCancel))">
							{{ row.IsCancel ? '恢復施作' : '不需施作' }}
						</el-button>

						<!-- <el-button v-if="[3,4].includes(deviceTypeNow)" size="mini" @click="toggleExpand(row)">詳情</el-button> -->
						<el-button type="info" size="mini" @click="showDetail(row)">檢視</el-button>
					</el-button-group>
					<el-button-group v-else>
						<el-button type="primary" size="mini" @click="finishRegisterSpec(row, false)">確定</el-button>
						<el-button size="mini" @click="row.edit = false; getList();">取消</el-button>
					</el-button-group>
				</template>
			</el-table-column>

			<el-table-column type="expand" width="1" align="center" style="display: none">
				<template slot-scope="{ row }">
					<span v-if="row.Content.length == 0">目前沒有資料</span>
					<span v-else>
						<h4 v-if="deviceTypeNow == 3">設計數量</h4>
						<el-table
							v-if="deviceTypeNow == 3"
							class="taskTable"
							empty-text="目前沒有資料"
							:data="row.Content_Plan"
							border
							fit
							highlight-current-row
							:header-cell-style="{ 'background-color': '#F2F6FC' }"
							stripe
							show-summary
							:summary-method="(param) => getSummaries(param, row.Content_Plan)"
							style="width: 100%"
						>
							<el-table-column type="index" label="序號" width="50" align="center" /> 
							<el-table-column
								v-for="(value, key) in detailHeaders[deviceTypeNow]"
								:key="key"
								:prop="key"
								:min-width="tableMinWidth(key)"
								:label="value.name"
								align="center"
								:sortable="value.sortable"
							>
								<template slot-scope="{ row: rowSpec, column: colSpec }">
									<span v-if="['ItemPaint', 'ItemType'].includes(colSpec.property)">{{ options[`${colSpec.property}Map`][rowSpec[colSpec.property]].name }}</span>
									<span v-else>{{ rowSpec[colSpec.property] }}</span>
								</template>
							</el-table-column>
						</el-table>

						<el-divider v-if="deviceTypeNow == 3" />

						<h4 v-if="deviceTypeNow == 3">實際數量</h4>
						<el-table
							class="taskTable"
							empty-text="目前沒有資料"
							:data="row.Content"
							border
							fit
							highlight-current-row
							:header-cell-style="{ 'background-color': '#F2F6FC' }"
							stripe
							:show-summary="deviceTypeNow == 3"
							:summary-method="(param) => getSummaries(param, row.Content)"
							style="width: 100%"
						>
							<el-table-column type="index" label="序號" width="50" align="center" /> 
							<el-table-column
								v-for="(value, key) in detailHeaders[deviceTypeNow]"
								:key="key"
								:prop="key"
								:min-width="tableMinWidth(key)"
								:label="value.name"
								align="center"
								:sortable="value.sortable"
							>
								<template slot-scope="{ row: rowSpec, column: colSpec }">
									<span v-if="['ItemPaint', 'ItemType'].includes(colSpec.property)">{{ options[`${colSpec.property}Map`][rowSpec[colSpec.property]].name }}</span>
									<span v-else>{{ rowSpec[colSpec.property] }}</span>
								</template>
							</el-table-column>
						</el-table>
						<div v-if="deviceTypeNow == 3" class="expand-note">
							<!-- <div>金額合計: ${{ detailAmount(row.Content).toLocaleString() || "-" }}</div> -->
							<div>施作數量: {{ row.KitNotes.DesignDetail || "-" }}</div>
							<div>施工方式: {{ row.KitNotes.DesignDesc || "-" }}</div>
							<div>施作人力: {{ row.KitNotes.DesignWorker || "-" }}</div>
						</div>
					</span>
				</template>
			</el-table-column>
		</el-table>
		<br>
		
		<el-button class="btn-previewPdf" :type="isAllCompleted ? 'danger' : 'success'" icon="el-icon-s-claim" :disabled="list.length == 0 || isAllCompleted" @click="finishRegister()">
			{{ isAllCompleted ? "已登錄" : "完工登錄" }}
		</el-button>

		<!-- <pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" /> -->

		<!-- Dialog: 照片上傳(機具單欄) -->
		<el-dialog v-loading="loading" width="520px" :title="`照片上傳(${options.workmemo[imgUploadKey]})`" :visible.sync="showMImgUploadDialog" :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false">
			<el-upload :key="`${imgUploadKey}Img`" action="#" :auto-upload="false" list-type="picture-card" :file-list="rowActive[`${imgUploadKey}Img`]" :on-change="handleChange" :on-preview="handlePreview" :on-remove="handleRemove">
				<i class="el-icon-plus" />
				<!-- <el-button slot="trigger" type="info">選取</el-button> -->
				<div slot="tip" class="el-upload__tip">只能上傳jpg/png文件，且不超過500kb</div>
			</el-upload>
			<div slot="footer" class="dialog-footer">
				<el-button @click="showMImgUploadDialog = false; getList();">取消</el-button>
				<el-button type="primary" @click="submitMImgUpload()">確定</el-button>
			</div>
		</el-dialog>

		<!-- Dialog: 照片上傳(多欄) -->
		<el-dialog v-loading="loading" width="520px" title="照片上傳" :visible.sync="showImgUploadDialog" :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false">
			<div v-if="deviceTypeNow == 3" class="filter-container">
				<el-select class="filter-item" v-model.number="rowActive.imgId" filterable placeholder="請選擇" popper-class="type-select" style="width: 120px">
					<el-option v-for="image in restoredImgMapFilter()" :key="image.Id" :value="Number(image.Id)" :label="image.ImgName" />
				</el-select>
				<el-button class="filter-item" type="success" size="mini" @click="addPicType()">加入類型</el-button>
			</div>

			<el-row v-for="(val, col) in restoredImgRegularFilter()" :key="col" type="flex" align="middle">
				<el-col :span="7">
					<span>{{ val.name }}</span>
					<el-button v-if="val.isAdd" type="danger" size="mini" style="padding: 5px; margin-left: 5px" @click="removePicType(col)">刪除</el-button>
				</el-col>
				<el-col :span="17" style="border-bottom: 1px solid #EBEEF5; padding: 0 5px 10px 5px">
					<el-upload action="#" :auto-upload="false" list-type="picture-card" :file-list="Number(col) ? rowActive.Image[col] : rowActive[`${col}Img`]" :on-change="(file, fileList) => handleChange(file, fileList, col)" :on-preview="(file) => handlePreview(file, col)" :on-remove="(file, fileList) => handleRemove(file, fileList, col)" @click.native="imgUploadKey = col">
						<i class="el-icon-plus" />
						<!-- <el-button slot="trigger" type="info">選取</el-button> -->
						<div slot="tip" class="el-upload__tip">只能上傳jpg/png文件，且不超過500kb</div>
					</el-upload>
				</el-col>
			</el-row>
			<div slot="footer" class="dialog-footer">
				<el-button @click="showImgUploadDialog = false; getList();">取消</el-button>
				<el-button type="primary" @click="submitImgUpload()">確定</el-button>
			</div>
		</el-dialog>

		<!-- Dialog: 數量-->
		<el-dialog width="900px" title="實際數量設計" :visible.sync="showEdit" :close-on-click-modal="false" :close-on-press-escape="false" :before-close="() => cleanDetail()">
			<el-row v-if="deviceTypeNow == 3" type="flex" align="middle" justify="center">
				<el-col class="task-table-text" :span="1">設計數量</el-col>
				<el-col :span="23">
					<el-table
						class="taskTable"
						v-loading="loading"
						empty-text="目前沒有資料"
						:data="rowActive.Content_Plan"
						border
						fit
						highlight-current-row
						:header-cell-style="{ 'background-color': '#F2F6FC' }"
						stripe
						show-summary
						:summary-method="(param) => getSummaries(param, rowActive.Content_Plan)"
						style="width: 100%"	
					>
						<el-table-column type="index" label="序號" width="50" align="center" /> 
						<el-table-column
							v-for="(value, key) in detailHeaders[deviceTypeNow]"
							:key="key"
							:prop="key"
							:min-width="tableMinWidth(key)"
							:label="value.name"
							align="center"
							:sortable="value.sortable"
						/>
					</el-table>
				</el-col>
			</el-row>

			<el-divider />

			<el-row type="flex" align="middle" justify="center">
				<el-col v-if="deviceTypeNow == 3" class="task-table-text" :span="1">實際數量</el-col>
				<el-col :span="deviceTypeNow == 3 ? 23 : 24">
					<div v-if="deviceTypeNow == 3" class="filter-container">
						<el-select class="filter-item" v-model.number="listQuery.groupSN" filterable placeholder="請選擇" popper-class="type-select" style="width: 500px">
							<el-option v-for="kit in options.kitArr" :key="kit.SerialNo" :value="Number(kit.SerialNo)" :label="kit.GroupName" />
						</el-select>
						<el-button class="filter-item" type="success" size="mini" @click="importKit()">匯入套組</el-button>
					</div>
					<el-table
						class="taskTable"
						v-loading="loading"
						empty-text="目前沒有資料"
						:data="detailPlus"
						border
						fit
						highlight-current-row
						:header-cell-style="{ 'background-color': '#F2F6FC' }"
						stripe
						:show-summary="deviceTypeNow == 3"
						:summary-method="(param) => getSummaries(param, rowActive.Content)"
						style="width: 100%"	
					>
						<el-table-column type="index" label="序號" width="50" align="center" /> 
						<el-table-column
							v-for="(value, key) in detailHeaders[deviceTypeNow]"
							:key="key"
							:prop="key"
							:min-width="tableMinWidth(key)"
							:label="value.name"
							align="center"
							:sortable="value.sortable"
						>
							<template slot-scope="{ row, column }">
								<!-- 設施 -->
								<span v-if="deviceTypeNow == 3">
									<span v-if="['number'].includes(column.property)" style="display: inline-flex; align-items: center;">
										<span v-if="row.isAdd || row.isEdit">
											<el-input v-model="row[column.property]" size="mini" style="width: 55px">
												<el-button slot="append" v-if="row.isEdit" class="btn-dialog" type="info" size="mini" @click="row.isEdit = false;">取消</el-button>
											</el-input>
										</span>
										<span v-else>
											<span>{{ row[column.property] }}</span>
											<el-button type="text" style="margin-left: 10px" size="mini" @click="row.isEdit = true">
												<i class="el-icon-edit" />
											</el-button>
										</span>
									</span>
									<span v-else-if="['UnitSN'].includes(column.property) && row.isAdd">
										<span v-if="row.isAdd || row.isEdit">
											<el-input v-model="row[column.property]" size="mini">
												<el-tooltip v-if="column.property == 'UnitSN' && row[column.property].length != 0" slot="suffix" effect="dark" placement="bottom" content="點選代入">
													<el-button type="text" style="padding: 5px 0" @click="getKitItem(row)">
														<i class="el-icon-check" style="color: #67C23A" />
													</el-button>
												</el-tooltip>
											</el-input>
										</span>
									</span>
									<span v-else>{{ row[column.property] }}</span>
								</span>

								<!-- 標線 -->
								<span v-else-if="deviceTypeNow == 4">
									<span v-if="['MillingFormula','number'].includes(column.property)" style="display: inline-flex; align-items: center;">
										<span v-if="row.isAdd || row.isEdit">
											<el-input v-model="row[column.property]" size="mini" @change="calArea(row)">
												<el-button slot="append" v-if="row.isEdit" class="btn-dialog" type="info" size="mini" @click="row.isEdit = false;">取消</el-button>
											</el-input>
										</span>
										<span v-else>
											<span>{{ row[column.property] }}</span>
											<el-button type="text" style="margin-left: 10px" size="mini" @click="row.isEdit = true">
												<i class="el-icon-edit" />
											</el-button>
										</span>
									</span>
									<span v-else-if="['ItemPaint', 'ItemType'].includes(column.property)">
										<span v-if="row.isAdd">
											<el-select v-model.number="row[column.property]" placeholder="請選擇" size="mini" popper-class="type-select" style="width: 120px">
												<el-option v-for="(val, id) in options[`${column.property}Map`]" :key="id" :value="Number(id)" :label="val.name" />
											</el-select>
										</span>
										<span v-else>{{ options[`${column.property}Map`][row[column.property]].name }}</span>
									</span>
									<span v-else>{{ row[column.property] }}</span>
								</span>
							</template>
						</el-table-column>

						<el-table-column label="動作" align="center" :min-width="30">
							<template slot-scope="{ row, $index }">
								<span v-if="row.isAdd">
									<el-button type="success" size="mini" @click="addItem">新增</el-button>
								</span>
								<span v-else-if="row.isEdit">
									<el-button type="primary" size="mini" @click="row.isEdit = false">確定</el-button>
								</span>
								<span v-else>
									<el-button type="danger" size="mini" @click="delItem($index)">刪除</el-button>
								</span>
							</template>
						</el-table-column>
					</el-table>
				</el-col>
			</el-row>
			<span v-if="deviceTypeNow == 3">
				<!-- <div class="detail-caption amount">實際數量金額合計: ${{ detailAmount(detailPlus).toLocaleString() }}</div> -->
				<el-divider />

				<el-row type="flex" align="middle" justify="center">
					<el-col class="task-table-text" :span="1">設計</el-col>
					<el-col class="detail-note plan" :span="23">
						<el-input placeholder="請輸入" v-model="rowActive.KitNotes_Plan.DesignDetail" disabled>
							<template slot="prepend">施作數量</template>
						</el-input>
						<el-input placeholder="請輸入" v-model="rowActive.KitNotes_Plan.DesignDesc" disabled>
							<template slot="prepend">施工方式</template>
						</el-input>
						<el-input placeholder="請輸入" v-model="rowActive.KitNotes_Plan.DesignWorker" disabled>
							<template slot="prepend">施作人力</template>
						</el-input>
					</el-col>
				</el-row>
				<el-row type="flex" align="middle" justify="center">
					<el-col class="task-table-text" :span="1">實際</el-col>
					<div class="detail-note">
						<el-input placeholder="請輸入" v-model="rowActive.KitNotes.DesignDetail">
							<template slot="prepend">施作數量</template>
						</el-input>
						<el-input placeholder="請輸入" v-model="rowActive.KitNotes.DesignDesc">
							<template slot="prepend">施工方式</template>
							<el-checkbox slot="append" v-model="rowActive.notesSync">更新「工程概述」</el-checkbox>
						</el-input>
						<el-input placeholder="請輸入" v-model="rowActive.KitNotes.DesignWorker">
							<template slot="prepend">施作人力</template>
						</el-input>
					</div>
				</el-row>
			</span>

			<div slot="footer" class="dialog-footer">
				<el-button @click="cleanDetail()">取消</el-button>
				<el-button type="primary" @click="finishRegisterSpec()">確定</el-button>
			</div>
		</el-dialog>

		<!-- Dialog: 案件退回 -->
		<el-dialog
			:visible.sync="showRevokeConfirm"
			width="300px"
			:show-close="false"
			:close-on-click-modal="false"
			:close-on-press-escape="false"
			center
		>	
			<span slot="title">
				<span v-if="rowActive.revokeType == 1">確認退回 案件編號{{ rowActive.CaseNo }} 至「主任分派」?</span>
				<span v-else-if="rowActive.revokeType == 2">確認退回 案件編號{{ rowActive.CaseNo }} 至「製作派工單」?</span>
			</span>
			<div v-if="rowActive.revokeType == 1">原因: 
				<el-select v-model="rowActive.revokeReason">
					<el-option v-for="( name, key ) in options.reasonType" :key="key" :label="name" :value="Number(key)" />
				</el-select>
				備註:
				<el-input v-model="revokeTextarea" class="revokeReasonNote" type="textarea" :rows="2" placeholder="請輸入備註" />
			</div>
			<span slot="footer" class="footer-btns">
				<el-button @click="showRevokeConfirm = false; revokeTextarea=''; getList();">取消</el-button>
				<el-button type="primary" @click="removeDispatch()">確定</el-button>
			</span>
		</el-dialog>

		<!-- Dialog: 案件檢視 -->
		<el-dialog width="500px" title="案件檢視" :visible.sync="showDetailDialog">
			<case-detail ref="caseDetail" :loading.sync="loading" :showDetailDialog.sync="showDetailDialog" :deviceTypeNow="deviceTypeNow" />
			<div slot="footer" class="dialog-footer">
				<!-- <el-button @click="showDispatch = false">取消</el-button> -->
				<el-button type="primary" @click="showDetailDialog = false">確定</el-button>
			</div>
		</el-dialog>

		<!-- Dialog: 照片預覽 -->
		<el-image-viewer
			v-if="showImgViewer"
			class="upload-preview"
			:on-close="() => { showImgViewer = false; }"
			:url-list="imgPreviewUrls"
			:initial-index="imgPreviewIndex"
		/>
	</div>
</template>

<script>
import moment from "moment";
import { getTenderMap, getKitItemMap, getGuildMap, getSCTypeItemMap, getRestoredImgMap } from "@/api/type";
import { getFinRegister, finImgUpload, finRegisterSpec, finRegister, caseCancel ,revokeDispatch, getTaskGroup, getTaskGroupDetail, getTaskReal } from "@/api/dispatch";
import CaseDetail from "@/components/CaseDetail";
import ElImageViewer from 'element-ui/packages/image/src/image-viewer';
// import Pagination from "@/components/Pagination";

export default {
	name: "finRegister",
	components: { ElImageViewer, CaseDetail },
	data() {
		return {
			loading: false,
			showRevokeConfirm: false,
			showImgViewer: false,
			showMImgUploadDialog: false,
			showImgUploadDialog: false,
			showEdit: false,
			showDetailDialog: true,
			screenWidth: window.innerWidth,
			searchRange: "",
			isAllCompleted: false,
			deviceTypeNow: 1,
			orderSNNow: 0,
			imgUploadKey: "",
			listQuery: {
				filterType: 2,
				filterStr: null,
				tenderId: null,
				deviceType: 1,
				contractor: null,
				// pageCurrent: 1,
				// pageSize: 50,
			},
			headers: {
				// CaseSN: {
				// 	name: "通報單號",
				// 	sortable: true,
				// },
				// CaseNo: {
				// 	name: "案件編號",
				// 	sortable: true,
				// },
				// casetype: {
				// 	name: "查報來源",
				// 	sortable: false,
				// },
				// DName: {
				// 	name: "案件類型",
				// 	sortable: false,
				// },
				Place: {
					name: "案件地點",
					sortable: false
				},
				IsMarking: {
					name: "補繪標線",
					sortable: false,
					deviceTypeFilter: [ 1, 2, 3 ]
				}
			},
			detailHeaders: {
				3: {
					UnitSN: {
						name: "項次",
						sortable: false,
					},
					TaskName: {
						name: "工程項目名稱",
						sortable: false,
					},
					TaskUnit: {
						name: "單位",
						sortable: false,
					},
					TaskPrice: {
						name: "單價",
						sortable: false,
					},
					number: {
						name: "數量",
						sortable: false,
					}
				},
				4: {
					ItemPaint: {
						name: "顏料",
						sortable: false
					},
					ItemType: {
						name: "維修項目",
						sortable: false
					},
					MillingFormula: {
						name: "公式",
						sortable: false
					},
					number: {
						name: "數量",
						sortable: false
					},
					MillingArea: {
						name: "面積",
						sortable: false
					}
				}
			},
			imgPreviewUrls: [],
			imgPreviewIndex: 0,
			imgObj: {
				add: [],
				remove: []
			},
			imgTypePlus: {},
			// total: 0,
			list: [],
			detail: [],
			rowActive: {
				Content: [],
				KitNotes: {
					DesignDetail: "",
					DesignDesc: "",
					DesignWorker: ""
				},
				Content_Plan: [],
				KitNotes_Plan: {
					DesignDetail: "",
					DesignDesc: "",
					DesignWorker: ""
				}
			},
			newItem: {
				3: {
					UnitSN: "",
					TaskName: "",
					TaskUnit: "",
					TaskPrice: "",
					number: 0,
					isAdd: true
				},
				4: {
					ItemPaint: 1,
					ItemType: 1,
					MillingFormula: "",
					number: 0,
					MillingArea: 0,
					editFormula: true,
					isAdd: true
				}
			},
			checkIndeterminate: false,
			checkList: [],
			tableSelectSum: { areaSUM: 0, tonneSUM: 0 },
			apiHeader: [ "SerialNo", "IsMarking", "MillingLength", "MillingWidth", "MillingDepth", "MillingFormula", "MillingArea", "Notes" ],
			options: {
				tenderMap: {},
				guildMap: {},
				deviceType: {
					1: "道路",
					2: "熱再生",
					3: "設施",
					4: "標線"
				},
				reasonType: {
					1: "無需施作",
					2: "退回重派"
				},
				workmemo: {
					"uStacker": "堆高機",
					"uDigger": "挖土機",
					"uPaver": "鋪裝機",
					"uRoller": "壓路機",
					"uSprinkler": "灑水車",
					"uNotes": "備註"
				},
				workmemoOrder: [ "uStacker", "uDigger", "uPaver", "uRoller", "uSprinkler", "uNotes" ],
				depthArr: [0, 5, 10],
				sampling: {
					typeMap: {
						34: "3/4",
						38: "3/8"
					},
					unitArr: ["噸", "m3"]
				},
				ItemPaintMap: {
					1: { name: "熱塑性塑膠" },
					2: { name: "油漆" }
				},
				ItemTypeMap: { },
				restoredImgRegular: {
					"UnderConstr": {
						name: "施工中照片",
						deviceTypeFilter: [ 1, 2 ]
					},
					"PostConstr": {
						name: "施工後照片",
						deviceTypeFilter: [ 1, 2, 3 ]
					},
					"Marking": {
						name: "補繪標線照片",
						deviceTypeFilter: [ 4 ]
					}
				},
				restoredImgMap: [],
				restoredImgFacility: {
					regular: [
						{ name: "側溝", imgId: [ 9, 10, 11 ] },
						{ name: "人行道", imgId: [ 13 ] }
					],
					items: [
						{ keyWord: "混凝土", imgId: [ 14 ] },
						{ keyWord: "格柵蓋板", imgId: [ 23 ] },
						{ keyWord: "鋼筋", imgId: [ 15, 16, 17, 18 ] },
						{ keyWord: "鋼版", imgId: [ 21, 22 ] },
						{ keyWord: "磚", imgId: [ 19 ] }
					]
				}
			},
			revokeTextarea: ""
		};
	},
	computed: { 
		headersFilter() {
			let headersFilter = {};
			Object.keys(this.headers).forEach(key => {
				const props = this.headers[key];
				if(!props.hasOwnProperty('deviceTypeFilter')) headersFilter[key] = props;
				else if(props.deviceTypeFilter.includes(this.deviceTypeNow)) headersFilter[key] = props;
			})
			return headersFilter
		},
		caseSum() {
			return this.list.reduce((acc, cur) => {
				acc.areaSUM += cur.MillingArea;
				acc.tonneSUM += Math.round(cur.MillingArea*cur.MillingDepth*0.01*2.25*10) / 10;
				return acc;
			}, { areaSUM: 0, tonneSUM: 0 });
		},
		detailPlus() {
			return [ ...this.detail, this.newItem[this.deviceTypeNow] ]
		}
	},
	watch: { },
	created() { 
		getTenderMap().then(response => { this.options.tenderMap = response.data.tenderMap });
		getGuildMap().then(response => { this.options.guildMap = response.data.guildMap });
		getSCTypeItemMap().then(response => { this.options.ItemTypeMap = response.data.SCType2Map });
		getRestoredImgMap().then(response => { this.options.restoredImgMap = response.data.restoredImgMap });
	},
	mounted() {
		this.showDetailDialog = false;
		if (this.$route.query.deviceType && this.$route.query.contractor && this.$route.query.orderSN) {
			this.listQuery.deviceType = Number(this.$route.query.deviceType);
			this.listQuery.contractor = Number(this.$route.query.contractor);
			this.listQuery.filterStr = this.$route.query.orderSN;
			this.getList();
		} 
	},
	methods: {
		tableRowClassName({row, rowIndex}) {
			if (row.IsCompleted)return 'success-row';
			else return 'danger-row';
		},
		cellCheckBox(row, index) {
			if(this.checkList[index]) this.$refs.caseTable.toggleRowSelection(row, true);
			else this.$refs.caseTable.toggleRowSelection(row, false);
		},
		toggleExpand(row) {
			if(this.deviceTypeNow == 3) {
				this.getTaskDetail(row).then(() => { 
					this.$refs.caseTable.toggleRowExpansion(row);
					// 調整總計列欄位
					this.$nextTick(() => { this.adjustTableLayout() });
				}).catch(err => this.loading = false);
			} else this.$refs.caseTable.toggleRowExpansion(row);
		},
		adjustTableLayout() {
			const expandTableSumList = document.querySelectorAll(".taskTable .el-table__footer-wrapper tr");
			// console.log(expandTableSumList);
			if(expandTableSumList.length != 0) {
				for(const tableList of expandTableSumList) {
					// console.log(tableList);
					const tdList = tableList.getElementsByTagName("td");
					if(tdList.length != 0) {
						tdList[0].colSpan = 4;
						tdList[0].style.textAlign = "center";
						tdList[1].style.display = "none";
						tdList[2].style.display = "none";
						tdList[3].style.display = "none";
						tdList[4].colSpan = 2;
						tdList[4].style.textAlign = "center";
						tdList[5].style.display = "none";
					}
				}
			}
		},
		tableMinWidth(key) {
			if(this.deviceTypeNow == 3) return ['TaskName'].includes(key) ? 100 : ['UnitSN', 'TaskUnit', 'TaskPrice'].includes(key) ? 20 : 30;
			else if(this.deviceTypeNow == 4) return ['MillingFormula'].includes(key) ? 90 : ['MillingArea'].includes(key) ? 20 : 55;
			else return null;
		},
		detailAmount(content) {
			return content.reduce((acc, cur) => (acc+=cur.number*(Number(cur.TaskPrice) || 0)), 0)
		},
		getSummaries(param, content) {
			const { columns, data } = param;
			const sums = [];
			columns.forEach((column, index) => {
				if (index === 0) {
					sums[index] = `金額合計`;
					return;
				}
				if(![1,2].includes(index)) {
					if(column.property == "TaskPrice") sums[index] = this.detailAmount(content).toLocaleString();
				}
			});
			return sums;
		},
		getList(showMsg = true) {
			if (!Number(this.listQuery.contractor)) {
				this.$message({
					message: "請選擇廠商",
					type: "error",
				});
			} else if (!Number(this.listQuery.filterStr)) {
				if(showMsg) this.$message({
					message: "請輸入正確派工單號",
					type: "error",
				});
			} else {
				this.loading = true;
				this.isAllCompleted = false;
				this.list = [];

				getFinRegister({
					contractor: this.listQuery.contractor,
					dispatchSN: this.listQuery.filterStr ? this.listQuery.filterStr : null,
					deviceType: this.listQuery.deviceType
				}).then(response => {
					if (response.data.list.length == 0) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
						this.total = 0;
					} else {
						this.list = response.data.list;
						this.isAllCompleted = this.list[0].IsAllCompleted == 1;
						this.checkList = Array.from({ length: this.list.length }, () => false);
						this.deviceTypeNow = this.listQuery.deviceType;
						this.orderSNNow = this.listQuery.filterStr;

						this.list.forEach(l => {
							l.DateClose = this.formatTime(l.DateClose);
							this.$set(l, "editFormula", l.MillingFormula != '0');
							for (const col of ['MillingDepth', 'MillingLength', 'MillingWidth', 'MillingArea']) 
								if(Number(l[col])) l[col] = Math.round(l[col] * 1000) / 1000;

							for(const mKey of Object.keys(this.options.workmemo).filter(key => key != 'uNotes'))
								if(l.hasOwnProperty(`${mKey}Img`) && Object.keys(l[`${mKey}Img`]).length > 0) this.$set(l, `${mKey}Img`, l[`${mKey}Img`].map(url => ({ name: url.split("/").slice(-1), status: "success", url })));
							
							for(const key of Object.keys(this.restoredImgRegularFilter())) 
								if(l.hasOwnProperty(`${key}Img`) && Object.keys(l[`${key}Img`]).length > 0) this.$set(l, `${key}Img`, l[`${key}Img`].map(url => ({ name: url.split("/").slice(-1), status: "success", url })));

							if(l.hasOwnProperty('Image')) {
								for(const key in l.Image) this.$set(l.Image, key, l.Image[key].map(url => ({ name: url.split("/").slice(-1), status: "success", url })));
							}

							if(l.hasOwnProperty('SamplingL1Detail')) {
								l.SamplingL1Detail = Object.keys(l.SamplingL1Detail).length == 0 
									? Object.assign({}, { Aggregate: "", Amount: 0, Unit: "" })
									: l.SamplingL1Detail;
							}

							if(l.hasOwnProperty('SamplingL2Detail')) {
								l.SamplingL2Detail = Object.keys(l.SamplingL2Detail).length == 0 
									? Object.assign({}, { Aggregate: "", Amount: 0, Unit: "" })
									: l.SamplingL2Detail;
							}

							if(l.MillingAreaArr) l.MillingArea = l.MillingAreaArr.reduce((acc, cur) => (acc+cur), 0);

							if(l.Content == undefined) {
								const Content = l.TaskRealGroup > 0 ? [{}] : [];
								this.$set(l, "Content", Content);
							}

							this.$set(l, "IsMarkingNow", l.IsMarking);
							this.$set(l, "notesSync", true);
							this.$set(l, "edit", false);
						})
					}
					this.loading = false;
				}).catch(err => this.loading = false);
			}
		},
		getTaskDetail(row) {
			return new Promise(resolve => {
				row.Content = [];
				getTaskReal({ taskRealGroup: row.TaskRealGroup || 0, taskRealGroup_Plan: row.TaskRealGroup_Plan }).then(response => {
					row.Content = response.data.list.filter(l => l.GroupId == row.TaskRealGroup);
					row.Content_Plan = response.data.list.filter(l => l.GroupId == row.TaskRealGroup_Plan);
					resolve();
				}).catch(err => this.loading = false);
			})
		},
		showDetail(row) {
			this.loading = true;
			this.$refs.caseDetail.getDetail(row);
		},
		calArea(row) {
			const replaceObj = { " ": "", "m2": "", "M2": "", "m": "", "M": "", "＋": "+", "－": "-", "＊": "*", "x": "*", "X": "*", "×": "*", "／": "/", "（": "(", "）": ")",
				"０": '0', "１": "1", "２": "2", "３": "3", "４": "4", "５": "5", "６": "6", "７": "7", "８": "8", "９": "9" };
			// const regex = new RegExp('^[0-9*+\/().-]+$', 'g');
			const regex = /^[^*+/-](?:[*+/-]?[(]*\d+\.?\d*[)]*)+$/g;
			const number = row.number != undefined ? Number(row.number) : 1;
			
			if( (row.editFormula == undefined && row.MillingFormula && row.MillingFormula != '0' && row.MillingFormula.length != 0) || row.editFormula) {
				for(const key in replaceObj) row.MillingFormula = row.MillingFormula.replaceAll(key, replaceObj[key]);
				row.MillingArea = regex.test(row.MillingFormula) ? Math.round(new Function(`return ${row.MillingFormula} * ${number}`)() * 100) / 100 : 0;
			} else row.MillingArea = Math.round(row.MillingLength * row.MillingWidth * number * 100) / 100;
		},
		caseFilterList(list) {
			// console.log(list);
			let caseFilterList = [];
			for(const row of list) {
				let caseItem = {};
				for(const key of this.apiHeader) caseItem[key] = row[key];
				caseFilterList.push(caseItem);
			}

			return caseFilterList;
		},
		formatTime(time) {
			return time ? moment(time).format("YYYY-MM-DD") : "";
		},
		cleanDetail() {
			this.detail = [];
			this.rowActive = {
				KitNotes: {
					DesignDetail: "",
					DesignDesc: "",
					DesignWorker: ""
				},
				Content: [],
				Content_Plan: [],
				KitNotes_Plan: {
					DesignDetail: "",
					DesignDesc: "",
					DesignWorker: ""
				},
				Image: {}
			};
			this.showEdit = false;
		},
		// 照片
		restoredImgRegularFilter() {
			let restoredImgRegularFilter = {};
			Object.keys(this.options.restoredImgRegular).forEach(key => {
				const props = this.options.restoredImgRegular[key];
				if(!props.hasOwnProperty('deviceTypeFilter')) restoredImgRegularFilter[key] = props;
				else if(props.deviceTypeFilter.includes(this.deviceTypeNow)) restoredImgRegularFilter[key] = props;
			})

			return Object.assign(restoredImgRegularFilter, this.imgTypePlus)
		},
		restoredImgMapFilter() {
			return this.options.restoredImgMap.filter(image => !Object.keys(this.imgTypePlus).includes(String(image.Id)) && (image.DeviceType == 0 || image.DeviceType == this.deviceTypeNow) );		
		},
		handleChange(file, fileList, key = this.imgUploadKey) {
			// console.log(file, fileList);
			if(file.status == 'ready') this.imgObj[key].add.push(file);
			if(Number(key)) this.rowActive.Image[key] = fileList;
			else this.rowActive[`${key}Img`] = fileList;
			// this.imgPreviewUrls = fileList.map(file => file.url);
		},
		handlePreview(file, key = this.imgUploadKey) {
			// console.log(file);
			this.imgPreviewUrls = Number(key) 
				? this.rowActive.Image[key].map(file => file.url)
				: this.rowActive[`${key}Img`].map(file => file.url);
			this.imgPreviewIndex = this.imgPreviewUrls.indexOf(file.url);
			this.showImgViewer = true;
		},
		handleRemove(file, fileList, key = this.imgUploadKey) {
			// console.log(file, fileList);
			if(file.status == 'success') this.imgObj[key].remove.push(file);
			else if(file.status == 'ready') this.imgObj[key].add = this.imgObj[this.imgUploadKey].add.filter(img => img.uid != file.uid);
			if(Number(key)) this.rowActive.Image[key] = fileList;
			else this.rowActive[`${key}Img`] = fileList;
			// this.imgPreviewUrls = fileList.map(file => file.url);
		},
		beforeMImgEdit(row, imgUploadKey) {
			for(const row of this.list) this.$refs.caseTable.toggleRowExpansion(row, false);
			this.rowActive = JSON.parse(JSON.stringify(row)); 
			this.imgUploadKey = imgUploadKey; 
			this.imgObj[this.imgUploadKey] = { add: [], remove: [] };
			this.showMImgUploadDialog = true;
		},
		beforeImgEdit(row) {
			for(const row of this.list) this.$refs.caseTable.toggleRowExpansion(row, false);

			this.getTaskDetail(row).then(()=> {
				this.rowActive = JSON.parse(JSON.stringify(row));
				this.imgObj = {};
				this.imgTypePlus = {};

				for(const imgId in row.Image) this.imgTypePlus[imgId] = { name: this.restoredImgMapFilter().filter(img => img.Id == imgId)[0].ImgName, isAdd: true };

				//(設施)增加照片之預設
				if(this.deviceTypeNow == 3) {
					let imgIdList = [];
					const imgRegular = this.options.restoredImgFacility.regular.filter(facType => facType.name === this.rowActive.DName);
					if(imgRegular.length != 0) imgIdList.push(...imgRegular[0].imgId);

					//獲取工程項目名稱
					let taskName = "";
					for(const t of this.rowActive.Content) taskName += t.TaskName;
					// console.log(taskName);

					for(const itemSpec of this.options.restoredImgFacility.items) {
						if(taskName.includes(itemSpec.keyWord)) imgIdList.push(...itemSpec.imgId);
					}

					for(const imgId of imgIdList) {
						if(Object.hasOwn(this.imgTypePlus, String(imgId))) this.imgTypePlus[imgId].isAdd = false;
						else {
							this.imgTypePlus[imgId] = { name: this.options.restoredImgMap.filter(img => img.Id == imgId)[0].ImgName, isAdd: false };
							this.imgObj[imgId] = { add: [], remove: [] };	
						}
					}
				}

				for(const key of Object.keys(this.restoredImgRegularFilter())) this.imgObj[key] = { add: [], remove: [] };
				
				this.showImgUploadDialog = true;
				this.$set(this.rowActive, "imgId", null);
			});
		},
		addPicType() {
			if(!this.rowActive.imgId) return;
			this.imgTypePlus[this.rowActive.imgId] = { name: this.restoredImgMapFilter().filter(img => img.Id == this.rowActive.imgId)[0].ImgName, isAdd: true };
			this.imgObj[this.rowActive.imgId] = { add: [], remove: [] };
			this.rowActive.imgId = null;
		},
		removePicType(key) {
			this.imgObj[key].remove = this.rowActive.Image[key] ? this.rowActive.Image[key].filter(file => file.status == 'success') : [];
			this.imgObj[key].add = [];
			this.$delete(this.imgTypePlus, key);
			this.$delete(this.rowActive.Image, key);
		},
		submitMImgUpload() {
			if(this.imgObj[this.imgUploadKey].add.length == 0 && this.imgObj[this.imgUploadKey].remove.length == 0) {
				this.showMImgUploadDialog = false;
				return;
			}

			this.loading = true;
			let uploadForm = new FormData();
			uploadForm.append('deviceType', this.deviceTypeNow);
			uploadForm.append('serialNo', this.rowActive.SerialNo);
			uploadForm.append('imgColKey', this.imgUploadKey);
			for(const file of this.imgObj[this.imgUploadKey].add.filter(f => (f.raw))) uploadForm.append('fileAddList', file.raw);
			for(const file of this.imgObj[this.imgUploadKey].remove.filter(f => (f.url))) uploadForm.append('fileRemoveList', file.url);

			finImgUpload(uploadForm).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "更新成功",
						type: "success",
					});
					this.showMImgUploadDialog = false;
					this.rowActive[`${this.imgUploadKey}Img`] = response.imgList.map(url => ({ name: url.split("/").slice(-1), status: "success", url }));
				} else {
					this.$message({
						message: "更新失敗",
						type: "error",
					});
				}
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		async submitImgUpload() {
			for(const [ index, key ] of Object.keys(this.imgObj).entries()) {
				if(this.imgObj[key].add.length == 0 && this.imgObj[key].remove.length == 0) {
					if(index == Object.keys(this.imgObj).length - 1) this.showImgUploadDialog = false;
					continue;
				}
				this.loading = true;

				let uploadForm = new FormData();
				uploadForm.append('deviceType', this.deviceTypeNow);
				uploadForm.append('serialNo', this.rowActive.SerialNo);
				if(Number(key)) uploadForm.append('imgId', key);
				else uploadForm.append('imgColKey', key);
				
				for(const file of this.imgObj[key].add.filter(f => (f.raw))) uploadForm.append('fileAddList', file.raw);
				for(const file of this.imgObj[key].remove.filter(f => (f.url))) uploadForm.append('fileRemoveList', file.url);

				await finImgUpload(uploadForm).then(response => {
					const imgName = this.restoredImgRegularFilter()[key] 
						? this.restoredImgRegularFilter()[key].name 
						: this.options.restoredImgMap.filter(image => image.Id == key)[0].ImgName;
					if ( response.statusCode == 20000 ) {
						this.$message({
							message: `${imgName}更新成功`,
							type: "success",
						});
						this.showImgUploadDialog = false;
						// this.rowActive[`${key}Img`] = response.imgList.map(url => ({ name: url.split("/").slice(-1), status: "success", url }));
						this.getList();
					} else {
						this.$message({
							message: `${imgName}更新失敗`,
							type: "error",
						});
					}
					this.loading = false;
				}).catch(err => this.loading = false);	
			}
		},
		// 計價數量
		async beforeEdit(row) {
			for(const row of this.list) this.$refs.caseTable.toggleRowExpansion(row, false);
			this.loading = true;

			if(this.deviceTypeNow == 3) {
				await this.getTaskDetail(row).then(() => { 
					this.rowActive = JSON.parse(JSON.stringify(row)); 
					this.detail = this.rowActive.Content;
					this.detail.forEach(row => {
						row.editFormula = true;
						this.$set(row, "isAdd", false);
						this.$set(row, "isEdit", false);
					});
				}).catch(err => this.loading = false);
			} else {
				this.rowActive = JSON.parse(JSON.stringify(row)); 
				this.detail = this.rowActive.Content;
				this.detail.forEach(row => {
					row.editFormula = true;
					this.$set(row, "isAdd", false);
					this.$set(row, "isEdit", false);
				});
			}

			const newItemSample = {
				3: { UnitSN: "", TaskName: "", TaskUnit: "", TaskPrice: "", number: 0, isAdd: true },
				4: { ItemPaint: 1, ItemType: 1, MillingFormula: "", number: 0, MillingArea: 0, editFormula: true, isAdd: true } 
			}
			Object.assign(this.newItem, newItemSample);

			if(this.deviceTypeNow == 3) {
				getTaskGroup({
					groupId: this.rowActive.DTeam,
					pageCurrent: 1,
					pageSize: 999999
				}).then(response => {
					this.options.kitArr = response.data.list;
					this.loading = false;
					this.showEdit = true;

					// 調整總計列欄位
					this.$nextTick(() => { this.adjustTableLayout() });
				}).catch(err => this.loading = false);
			} else {
				this.loading = false;
				this.showEdit = true;

				// 調整總計列欄位
				this.$nextTick(() => { this.adjustTableLayout() });
			}
		},
		importKit() {
			this.loading = true;
			getTaskGroupDetail({
				groupSN: this.listQuery.groupSN,
			}).then(response => {
				const itemArr = response.data.list;
				itemArr.forEach(itemAdd => {
					const detailFilter = this.detail.filter(itemNow => itemNow.UnitSN == itemAdd.UnitSN);
					if( detailFilter.length == 0) this.detail.push(itemAdd);
					else detailFilter[0].number += itemAdd.number;
				});
				this.detail.forEach(l => { this.$set(l, "isEdit", false); });

				const isReplaceNote = (Object.values(this.rowActive.KitNotes).filter(val => val && val.length != 0)).length == 0;
				if(isReplaceNote) this.rowActive.KitNotes = this.options.kitArr.filter(kit => (kit.SerialNo == this.listQuery.groupSN)).map(kit => ({ DesignDetail: kit.DesignDetail, DesignDesc: kit.DesignDesc, DesignWorker: kit.DesignWorker }))[0];

				this.loading = false;
			}).catch(err => this.loading = false);
		},
		async getKitItem(row) {
			return new Promise(resolve => {
				this.loading = true;
				const rowActive = row.SerialNo != undefined ? row : this.newItem[this.deviceTypeNow];
				Object.assign(rowActive, { TaskName: "", TaskUnit: "", TaskPrice: "" });

				getKitItemMap({
					tenderId: String(this.rowActive.DTeam),
					UnitSN: rowActive.UnitSN
				}).then((response) => {
					if (response.data.item == undefined) {
						this.$message({
							message: "查無項次資料",
							type: "error",
						});
					} else {
						Object.assign(rowActive, response.data.item);
					}
					this.loading = false;
					resolve();
				}).catch(err => { this.loading = false; resolve(); });
			})
		},
		async addItem() {
			if(this.deviceTypeNow == 3) await this.addKitItem();
			else if(this.deviceTypeNow == 4) this.addMarkerItem();
		},
		async addKitItem() {
			const newItem = this.newItem[this.deviceTypeNow];
			if(!newItem.UnitSN) {
				this.$message({
					message: "請填入正確項次",
					type: "error",
				});

				return;
			}

			await this.getKitItem(newItem);

			if(!newItem.TaskName || !newItem.TaskUnit || !newItem.TaskPrice || newItem.number == 0) {
				const itemText = newItem.number == 0 ? "數量" : "項次";
				this.$message({
					message: `請填入正確${itemText}`,
					type: "error",
				});
			} else {
				newItem.isAdd = false;
				this.detail.push({...newItem, isEdit: false});

				Object.assign(newItem, { UnitSN: "", TaskName: "", TaskUnit: "", TaskPrice: "", number: 0, isAdd: true });
			}
		},
		async addMarkerItem() {
			const newItem = this.newItem[this.deviceTypeNow];
			if(!newItem.ItemPaint || !newItem.ItemType || newItem.MillingFormula.length == 0 || newItem.number == '0') {
				const itemText = newItem.MillingFormula.length == 0 ? "公式" : "數量";
				this.$message({
					message: `請填入正確${itemText}`,
					type: "error",
				});
			} else {
				newItem.isAdd = false;
				this.detail.push({...newItem, isEdit: false});

				Object.assign(newItem, { ItemPaint: 1, ItemType: 1, MillingFormula: "", number: 1, MillingArea: 0, editFormula: true, isAdd: true });
			}
		},
		delItem(index) {
			this.detail.splice(index, 1);
		},
		// 完工登錄
		finishRegisterSpec(row = this.rowActive, editContent = true) {
			this.$confirm(`確認 案件編號${row.CaseNo} 資料登錄?`, "確認", { showClose: false })
				.then(() => {
					this.loading = true;
					row.edit = false;
					this.showEdit = false;

					if(!row.editFormula) row.MillingFormula = '0';
					let caseSpec = JSON.parse(JSON.stringify(this.caseFilterList([row])[0]));

					if([1,2].includes(this.deviceTypeNow)) {
						this.calArea(caseSpec);

						if(caseSpec.MillingFormula && caseSpec.MillingFormula != '0' && caseSpec.MillingFormula.length != 0) {
							delete caseSpec.MillingLength;
							delete caseSpec.MillingWidth;
						} else delete caseSpec.MillingFormula;

						for(const key of [ "uStacker", "uSprinkler", "uDigger", "uRoller", "uPaver", "uNotes" ]) caseSpec[key] = row[key];

						if(this.deviceTypeNow == 1) {
							for(const key of [ "Aggregate34", "Aggregate38", "SamplingL1", "SamplingL2" ]) caseSpec[key] = row[key];

							if(caseSpec.SamplingL1 && caseSpec.SamplingL1 == 1) caseSpec.SamplingL1Detail = JSON.stringify(row.SamplingL1Detail);
							if(caseSpec.SamplingL2 && caseSpec.SamplingL2 == 1) caseSpec.SamplingL2Detail = JSON.stringify(row.SamplingL2Detail);
						}
					} else if([3,4].includes(this.deviceTypeNow)) {
						this.detail.forEach(row => {
							row.number = Number(row.number);
							for(const key of [ "SerialNo", "GroupId", "editFormula", "isAdd", "isEdit" ]) delete row[key];
						});

						if(this.deviceTypeNow == 3) {
							if(this.detail.length > 0) {
								caseSpec.TaskRealGroup = row.TaskRealGroup;
								caseSpec.KitContent = this.detail;
							}
							caseSpec.KitNotes = JSON.stringify(row.KitNotes);
							caseSpec.Notes = (editContent && row.notesSync) ? row.KitNotes.DesignDesc : row.Notes;
						} else if(this.deviceTypeNow == 4) caseSpec.Content = JSON.stringify(editContent ? this.detail : row.Content);
					}

					if(caseSpec.IsMarking) caseSpec.Content = JSON.stringify(row.Content);

					finRegisterSpec({
						deviceType: this.deviceTypeNow,
						caseSpec
					}).then(response => {
						if ( response.statusCode == 20000 ) {
							this.$message({
								message: "登錄成功",
								type: "success",
							});
						} else {
							this.$message({
								message: "登錄失敗",
								type: "error",
							});
						}
						this.getList();
					}).catch(err => {
						console.log(err);
						this.getList();
					});
				}).catch(err => {});
		},
		finishRegister() {
			this.$confirm(`確認將 派工單號${this.orderSNNow} 完工登錄?`, "確認", { showClose: false })
				.then(() => {
					const tableSelectFilter = this.list.filter(caseSpec => !Boolean(caseSpec.IsCompleted) || (caseSpec.IsCancel != undefined && !Boolean(caseSpec.IsCancel)) && (caseSpec.Content != undefined && caseSpec.Content.length == 0)); 
					if(tableSelectFilter.length != 0) {
						this.$message({
							type: "error",
							message: `案件編號${ tableSelectFilter.map(caseSpec => caseSpec.CaseNo).join("、") } 未確認資料登錄`
						});
					} else {
						this.loading = true;
						let caseList = JSON.parse(JSON.stringify(this.caseFilterList(this.list)));

						caseList.forEach(row => {
							if([1,2].includes(this.deviceTypeNow)) {
								this.calArea(row);

								if(row.MillingFormula && row.MillingFormula != '0' && row.MillingFormula.length != 0) {
									delete row.MillingLength;
									delete row.MillingWidth;
								} else delete row.MillingFormula;
							}
							if(this.deviceTypeNow == 4) delete row.IsMarking;
						});

						finRegister({
							deviceType: this.deviceTypeNow,
							orderSN: Number(this.orderSNNow),
							caseList
						}).then(response => {
							if ( response.statusCode == 20000 ) {
								this.$message({
									message: "登錄成功",
									type: "success",
								});
							} else {
								this.$message({
									message: "登錄失敗",
									type: "error",
								});
							}
							this.getList();
						}).catch(err => {
							console.log(err);
							this.getList();
						});
					}
				}).catch(err => {});
		},
		// 退回
		beforeRemove(row, revokeType) {
			this.rowActive = JSON.parse(JSON.stringify(row)); 
			this.$set(this.rowActive, "revokeType", revokeType);
			this.$set(this.rowActive, "revokeTextarea", this.revokeTextarea);
			if (revokeType == 1) this.$set(this.rowActive, "revokeReason", 1);
			this.showRevokeConfirm = true;
		},
		removeDispatch() {
			// revokeType(退回類型)- 1: 退回主任分派, 2: 退回廠商製作派工單"
			if (this.rowActive.revokeType == 1) 
				this.rowActive.revokeReason = this.options.reasonType[this.rowActive.revokeReason];
			let mergeRevokeReason = String(this.rowActive.revokeReason) + "-" + String(this.revokeTextarea);
			// console.log(mergeRevokeReason);
			revokeDispatch({
				revokeType: this.rowActive.revokeType,
				revokeReason: mergeRevokeReason,
				deviceType: this.deviceTypeNow,
				serialNo: this.rowActive.SerialNo
			}).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "退回成功",
						type: "success",
					});
				} else {
					this.$message({
						message: "退回失敗",
						type: "error",
					});
				}
				this.getList(false);
				this.showRevokeConfirm = false;
			}).catch(err => {
				console.log(err);
				this.getList(false);
				this.showRevokeConfirm = false;
			});
		},
		finishCancel(row, isCancel) {
			const confirmText = isCancel == 1 ? `確認將 案件編號${row.CaseNo} 標記為「不需施作」?` :`確認將 案件編號${row.CaseNo} 恢復成「施作狀態」?`;
			this.$confirm(confirmText, "確認", { showClose: false })
				.then(() => {
					caseCancel({
						deviceType: this.deviceTypeNow,
						serialNo: row.SerialNo,
						isCancel
					}).then(response => {
						if ( response.statusCode == 20000 ) {
							this.$message({
								message: "標記成功",
								type: "success",
							});
						} else {
							this.$message({
								message: "標記失敗",
								type: "error",
							});
						}
						this.getList();
					}).catch(err => {
						console.log(err);
						this.getList();
					});
				}).catch(err => {});
		}
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.imgHover
	max-width: 800px
.finish-register
	.el-select
		.el-input__inner
			padding-left: 3px
			padding-right: 10px
			text-align: center
		.el-input__suffix
			right: 0
			// margin-right: -5px
			transform: scale(0.7)
	.filter-container
		.filter-item
			margin-right: 5px
			.el-select
				width: 110px
				&.tender-select
					width: 520px
			.select-contract
				.el-select:first-child .el-input__inner
					background-color: #F5F7FA
					color: #909399
					border-right: none
					border-top-right-radius: 0
					border-bottom-right-radius: 0
					&:focus
						border-color: #DCDFE6
				.el-select:last-child .el-input__inner
					border-top-left-radius: 0
					border-bottom-left-radius: 0
					padding-left: 10px
					text-align: left
	.btn-previewPdf
		position: relative
		left: 50%
		transform: translateX(-50%)
	.el-table
		.success-row 
			background: #F0F9EB
			&.hover-row > td
				background-color: initial !important
		.danger-row
			background: #F9EBEB
			&.hover-row > td
				background-color: initial !important
		.el-input__inner
			padding: 0 5px
		.btn-tag
			cursor: pointer
		.el-table__expand-icon
			display: none
		.item-content
			color: #C0C4CC
		.el-checkbox
			margin-right: 0
		.el-icon-edit
			color: #67C23A
			margin-bottom: 5px
			&:hover
				color: white
				background-color: #67C23A
				border-radius: 50%
		.el-icon-success
			margin-right: -10px
		.el-icon-error
			color: #F56C6C
	.detail-caption
		width: 100%
		height: 30px
		font-size: 16px
		font-weight: bold
		text-align: center
		line-height: 30px
		&.title
			padding-bottom: 40px
			border-bottom: 1px solid #DFE6EC
		&.amount
			// border: 1px solid #DFE6EC
			background-color: #DFE6EC
			margin: 10px 0 30px 0
	.detail-note
		margin-top: 10px
		&.plan .el-input.is-disabled .el-input__inner
			background-color: #F8F8FF
			color: inherit
			cursor: auto
	.expand-note 
		padding: 10px 0 0 10px
		& > *
			font-size: 14px
			margin: 5px 0
	/*去除el-upload组件動畫*/
	.el-upload-list__item 
		// transition-delay: -0.45s !important
		transition-duration: 0.02s !important
	// .el-upload-list__item-thumbnail 
	// 	object-fit: scale-down !important
	.task-table-text
		font-size: 16px
		letter-spacing: 4px
		writing-mode: vertical-lr
	.btn-dialog
		padding: 5px 5px
	.upload-preview
		width: 100%
		z-index: 3000 !important
		.el-icon-circle-close
			color: white
	.el-dialog
		.el-dialog__body > div
			margin-top: 10px
		.el-select
			margin-top: 5px
			margin-bottom: 5px
			width: 250px
		.revokeReasonNote
			margin-top: 5px
			width: 250px
		.footer-btns
			display: flex
			justify-content: center
</style>
