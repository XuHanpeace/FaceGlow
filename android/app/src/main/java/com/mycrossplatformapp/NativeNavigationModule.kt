package com.mycrossplatformapp

import android.content.Intent
import android.os.Bundle
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class NativeNavigationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "NativeNavigation"

    @ReactMethod
    fun openNewScreen(screenName: String, params: ReadableMap) {
        val activity = currentActivity ?: return
        
        try {
            // 获取目标 Activity 的类
            val targetClass = Class.forName("com.mycrossplatformapp.$screenName")
            val intent = Intent(activity, targetClass)
            
            // 将 params 转换为 Bundle 并添加到 Intent 中
            val bundle = Bundle()
            val iterator = params.keySetIterator()
            while (iterator.hasNextKey()) {
                val key = iterator.nextKey()
                when (val value = params.getDynamic(key)) {
                    is String -> bundle.putString(key, value)
                    is Int -> bundle.putInt(key, value)
                    is Double -> bundle.putDouble(key, value)
                    is Boolean -> bundle.putBoolean(key, value)
                    // 可以根据需要添加其他类型的处理
                }
            }
            intent.putExtras(bundle)
            
            // 启动新的 Activity
            activity.startActivity(intent)
            
        } catch (e: ClassNotFoundException) {
            // 处理找不到对应 Activity 的情况
            e.printStackTrace()
        } catch (e: Exception) {
            // 处理其他异常
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun closeScreen() {
        // 实现关闭当前页面的逻辑
        currentActivity?.finish()
    }
} 