<template>
	<div class="wscn-http404-container">
		<el-row class="wscn-http404">
			<el-col :span="24" :md="16" class="pic-404">
				<img
					class="pic-404__parent"
					src="/assets/gif/404.gif"
					alt="404"
				/>
				<!-- <img class="pic-404__parent" src="@/assets/404_images/404.png" alt="404"> -->
				<img
					class="pic-404__child left"
					src="@/assets/404_images/404_cloud.png"
					alt="404"
				/>
				<img
					class="pic-404__child mid"
					src="@/assets/404_images/404_cloud.png"
					alt="404"
				/>
				<img
					class="pic-404__child right"
					src="@/assets/404_images/404_cloud.png"
					alt="404"
				/>
			</el-col>
			<el-col :span="24" :md="8" class="bullshit">
				<div class="bullshit__oops">抱歉！！</div>
				<!-- <div class="bullshit__info">All rights reserved
					<a style="color:#20a0ff" href="https://wallstreetcn.com" target="_blank">wallstreetcn</a>
				</div> -->
				<div class="bullshit__headline">{{ message }}</div>
				<div class="bullshit__info">
					請確定您的權限，或者點擊下面按鈕返回首頁。
				</div>
				<a href="" class="bullshit__return-home">返回首頁</a>
			</el-col>
		</el-row>
	</div>
</template>

<script>
export default {
	name: "Page404",
	computed: {
		message() {
			return "您沒有權限進入此網頁";
		},
	},
};
</script>

<style lang="scss" scoped>
// * {
//   border: 1px solid #000;
// }
.wscn-http404-container {
	// transform: translate(-50%,-50%);
	// position: absolute;
	// top: 40%;
	// left: 50%;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
}
.wscn-http404 {
	position: relative;
	// width: 1200px;
	width: 100%;
	padding: 0 50px;
	// overflow: hidden;
	.pic-404 {
		position: relative;
		// float: left;
		// width: 600px;
		margin: 0 auto;
		overflow: hidden;
		&__parent {
			width: 100%;
		}
		&__child {
			position: absolute;
			&.left {
				width: 80px;
				top: 17px;
				left: 220px;
				opacity: 0;
				animation-name: cloudLeft;
				animation-duration: 2s;
				animation-timing-function: linear;
				animation-fill-mode: forwards;
				animation-delay: 1s;
				animation-iteration-count: infinite;
			}
			&.mid {
				width: 46px;
				top: 10px;
				left: 420px;
				opacity: 0;
				animation-name: cloudMid;
				animation-duration: 2s;
				animation-timing-function: linear;
				animation-fill-mode: forwards;
				animation-delay: 1.2s;
				animation-iteration-count: infinite;
			}
			&.right {
				width: 62px;
				top: 100px;
				left: 500px;
				opacity: 0;
				animation-name: cloudRight;
				animation-duration: 2s;
				animation-timing-function: linear;
				animation-fill-mode: forwards;
				animation-delay: 1s;
				animation-iteration-count: infinite;
			}
			@keyframes cloudLeft {
				0% {
					top: 17px;
					left: 220px;
					opacity: 0;
				}
				20% {
					top: 33px;
					left: 188px;
					opacity: 1;
				}
				80% {
					top: 81px;
					left: 92px;
					opacity: 1;
				}
				100% {
					top: 97px;
					left: 60px;
					opacity: 0;
				}
			}
			@keyframes cloudMid {
				0% {
					top: 10px;
					left: 420px;
					opacity: 0;
				}
				20% {
					top: 40px;
					left: 360px;
					opacity: 1;
				}
				70% {
					top: 130px;
					left: 180px;
					opacity: 1;
				}
				100% {
					top: 160px;
					left: 120px;
					opacity: 0;
				}
			}
			@keyframes cloudRight {
				0% {
					top: 100px;
					left: 500px;
					opacity: 0;
				}
				20% {
					top: 120px;
					left: 460px;
					opacity: 1;
				}
				80% {
					top: 180px;
					left: 340px;
					opacity: 0;
				}
				100% {
					top: 200px;
					left: 300px;
					opacity: 0;
				}
			}
		}
	}

	.bullshit {
		position: relative;
		// float: left;
		width: 300px;
		// height: 100%;
		padding: 130px 0;
		overflow: hidden;
		&__oops {
			font-size: 32px;
			font-weight: bold;
			line-height: 40px;
			color: #1482f0;
			opacity: 0;
			margin-bottom: 20px;
			animation-name: slideUp;
			animation-duration: 0.5s;
			animation-fill-mode: forwards;
		}
		&__headline {
			font-size: 20px;
			line-height: 24px;
			color: #222;
			font-weight: bold;
			opacity: 0;
			margin-bottom: 10px;
			animation-name: slideUp;
			animation-duration: 0.5s;
			animation-delay: 0.1s;
			animation-fill-mode: forwards;
		}
		&__info {
			font-size: 13px;
			line-height: 21px;
			color: grey;
			opacity: 0;
			margin-bottom: 30px;
			animation-name: slideUp;
			animation-duration: 0.5s;
			animation-delay: 0.2s;
			animation-fill-mode: forwards;
		}
		&__return-home {
			display: block;
			float: left;
			width: 110px;
			height: 36px;
			background: #1482f0;
			border-radius: 100px;
			text-align: center;
			color: #ffffff;
			opacity: 0;
			font-size: 14px;
			line-height: 36px;
			cursor: pointer;
			animation-name: slideUp;
			animation-duration: 0.5s;
			animation-delay: 0.3s;
			animation-fill-mode: forwards;
		}
		@keyframes slideUp {
			0% {
				transform: translateY(60px);
				opacity: 0;
			}
			100% {
				transform: translateY(0);
				opacity: 1;
			}
		}
	}

	@media screen and (max-width: 991px) {
		.pic-404 {
			width: 800px;
			height: 600px;
			left: 50%;
			transform: translate(-50%, -20%);
			margin-bottom: -100%;
			.pic-404__child {
				display: none;
			}
		}
		.bullshit {
			padding: 30px 0;
		}
	}
}
</style>
