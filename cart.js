/* 零、HTML文件加載完，再執行JS。 目的=安全+一致性，避DOM未載完就執行JS  */
document.addEventListener("DOMContentLoaded", function() {  
/*壹、宣告後續頻繁使用的全域變數  ，越常用=排序首行*/
    var qtyInputs   = document.querySelectorAll(".qty");             //本質仍物件+亦是類陣列 可操作forEach方法
    var pageContent = document.getElementById("page-content"); 

/*貳、點擊事件觸發前，需完成的效果們*/
/*一、頁面載完 即需隱藏的元素(模態框相關)  ，利於其他元素 於正確的顯示or隱藏狀態下被接著執行 */
    var deleteModal = document.getElementById("deleteModal");
    var deleteModalBackground = document.getElementById("deleteModalBackground");
    var orderModal = document.getElementById("orderModal");
    deleteModal.style.display = "none";
    deleteModalBackground.style.display = "none";
    orderModal.style.display = "none";

/*二、頁面載完且隱藏必須元素 ， 即需依cookie更正 購物車相關初始化的值 */  
/*函式名稱? forEach跟.addEventListener常用匿名函式
           若函式複雜、於多處被重複利用、需被測試，採具名函式*/ 
/*二(一) 初始化的主要函式*/
    function initializeCart() {                            //無須外部參數傳遞資料，利用頁面既有變數、函式、cookie
        qtyInputs.forEach(function(qtyInput) {
            //取得特定位置: 找該商品總欄 >  總欄內的該商品id > 找該商品id 在cookie儲存的值
            var itemBody  = qtyInput.closest(".item-body");  
            var itemId    = itemBody.id;                           
            var storedQty = getCookie(itemId);            //呼叫取得cookie的函式，傳入新參數來更新值
            //判斷取得cookie 是否儲存數量  來"設定"數量的初始化值
            if (storedQty){                           
                qtyInput.value = storedQty;
            }else{                                      //storedQty 不存在，需自行設0 (否則storedQty為undefined)
                qtyInput.value = "0";
            }
            //連帶:更新該商品的總價
            updateTotal(qtyInput); 
        });
        //所有商品總價更新後，連帶:一次性更新 商品總額 + 結帳資訊
        updateTotalAmount();
        updateCheckout();
    }
/*二(二) 初始化的輔助函式 ，處理cookie*/
/* 二(二之1) 資料儲存進cookie     :  寫入  設路徑*/ 
    function saveToCookie(itemId, qty) {                        //第一個參數 作為cookie名稱、第二個參數 作為cookie值
       document.cookie = itemId + "=" + qty + ";path=/";   
       //document.cookie       設定或取得 瀏覽器cookie  
       // itemId + "=" + qty   寫入 Cookie    "key=value"      //如:itemId 是 "item2"，qty 是 "10"， 產生新字符串 "item2=10"
       // ;path=/              設定cookie新參數                //指定路徑設為/  表示可在所有頁面下被讀取或寫入
   }
/* 二(二之2) 取得特定cookie名稱的值 : 找特定名稱  分割以便好找  檢查找對名稱  返回值 */  
    function getCookie(name) {                            
       var nameEQ = name + "=";             //命名用意:nameequals    //從 document.cookie 找特定名稱的值? 須找到 字串"名稱="  才可取出後面的值
       var ca = document.cookie.split(";"); //命名用意:cookie array  /*split() 是String 物件的方法: 將一個字串分割多個子字串且放入一個陣列。參數寫; 則陣列內每元素用;隔開*/ 
       for(var i=0;i < ca.length;i++){                             // 操作ca內的每個cookie 
           var c = ca[i].trim();                                   /* trim()  是String 物件的方法: 去掉字串前後的空白字符*/ 
           if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
                                                                  /* indexOf()是String物件的方法:  返回 指定子字串 在原字串的首次出現位置 (找不到則返回-1)。 參數放 要找字串 
                                                                              也是陣列的方法: 找特定元素的索引值*/
                                                                   //if 找到需要的cookie ，return該 cookie 的值
                                                                    //c.indexOf(nameEQ)  找出nameEQ元素在c (去掉空格的陣列)的位置
                                                                   /*substring()是String物件的方法:  返回原字串中指定範圍的子字串。  參數放(起始索引 ps包含 , 结束索引 ps不包含)*/
       }
       return null;  // for 迴圈結束後，若無找到需要cookie，則回傳null表示未找到
   }
   /*當初始化的主要+輔助函式都宣告完畢 ，才呼叫*/
    initializeCart();

/*三、初始化完，使用者操作頁面*/
/*三(一之1)、頁面載完，點擊/選etc操作:
            購物車列表: 取得元素節點 監聽事件  把事件處理程式設為函式並執行 
            結帳資訊  : 取得操作運費+輸入優惠碼*/ 
    qtyInputs.forEach(function(qtyInput) {
       //(1-1)改變相鄰節點的數量值= 只需取得qty相鄰節點 (毋庸找itemId)(不使用document.querySelectorAll方法) 
        var minusButton = qtyInput.previousElementSibling;
        var plusButton = qtyInput.nextElementSibling;
         //把參數傳遞事件監聽函式，用匿名函式 //只寫呼叫的事件處理程式函式(已含取得特定位置、連帶更新)
        minusButton.addEventListener("click", function() {  
            decrementQty(qtyInput);
        });
        plusButton.addEventListener("click", function() {
            incrementQty(qtyInput);
        });

       //(1-2)非相鄰節點、多個同類型節點要處理 =.querySelectorAll ，才能為每元素添加事件監聽程式
        var deleteButtons = document.querySelectorAll(".delete");
        deleteButtons.forEach(function(deleteButton) {
            deleteButton.addEventListener("click", function() {
                //取得特定位置 (沒為此另設函式) ，讓跳出模態框正確刪特定商品
                var itemId = deleteButton.closest(".item-body").id; 
                confirmDelete(itemId);
            });
        });
    });
    document.getElementById("deliveryMethod").addEventListener("change", function() {
        updateCheckout();
    });
    document.getElementById("promotionCode").addEventListener("input", function() {
        updateCheckout();
    });
/*三(一之2) 離開頁面前，確保cookie儲存使用者操作後資料*/
    window.addEventListener("beforeunload", function() {
        qtyInputs.forEach(function(qtyInput) {
           var itemId = qtyInput.closest(".item-body").id;
           saveToCookie(itemId, qtyInput.value);
        });
    });

/*先寫完所有.addEventListener,才依序寫所有function任務*/
    /*值:字串轉換數字，當值遞改  找對應itemId  資料儲存進cookie 連帶更新函式(總價+商品總額 + 結帳資訊)*/
    function decrementQty(qtyInput) {
       var currentValue = parseInt(qtyInput.value, 10);  //因HTML是標記語言，均以字串形式儲存 故標籤的屬性為字串(即使輸入數字)
       if (currentValue > 0) {
           qtyInput.value = currentValue - 1;
           var itemId = qtyInput.closest(".item-body").id;
           saveToCookie(itemId, qtyInput.value);
           updateTotal(qtyInput);
           updateTotalAmount();
           updateCheckout();
       }
    }
    function incrementQty(qtyInput) {
       var currentValue = parseInt(qtyInput.value, 10);
       if (currentValue < 10) {
           qtyInput.value = currentValue + 1;
           var itemId = qtyInput.closest(".item-body").id;
           saveToCookie(itemId, qtyInput.value);
           updateTotal(qtyInput);
           updateTotalAmount();
           updateCheckout();
       }else{
            alert("此商品購買上限為10個!");
       }
    }
    //防呆刪除的模態框
    function confirmDelete(itemId) {
        //正常顯示
        pageContent.style.pointerEvents = "none"; 
        deleteModal.style.display = "block";
        deleteModalBackground.style.display = "block";
        //點擊按鈕的事件處理程式 //用onclick(因confirmDelete(itemId) 函式會被多次呼叫 來刪特定id商品)，避用.addEventListener(因對同元素的同事件添加相同事件監聽程式，只在首次呼叫函式)
        var confirmButton = document.getElementById("confirmDeleteButton");
        var cancelButton = document.getElementById("cancelDeleteButton");
        confirmButton.onclick = function() {
            deleteItem(itemId);
            saveToCookie(itemId, 0);  //參數命名慣例: 表示數量時，值設0代表不存在或已刪除
            deleteModal.style.display = "none";
            deleteModalBackground.style.display = "none";
            pageContent.style.pointerEvents = 'auto'; 
        }
        cancelButton.onclick = function() {
            deleteModal.style.display = "none";
            deleteModalBackground.style.display = "none";
            pageContent.style.pointerEvents = 'auto'; 
        }
    }
    function deleteItem(itemId) {      
        var itemToDelete = document.getElementById(itemId);
        if (itemToDelete) {         //刪除移出 儲存到cookie  連帶更新
            itemToDelete.remove();
            saveToCookie(itemId, 0);
            updateTotalAmount();
            updateCheckout();
        }
    }
    /*更新 特定商品總額: 取得所有節點(毋庸找itemId)    轉換  計算相乘 顯示 */
    //序:需先取得sum元素，以利運算結果  最終顯示在頁面
    function updateTotal(input) {   
       var itemBody = input.closest(".item-body");
       var priceElement = itemBody.querySelector(".price");
       var sumElement = itemBody.querySelector(".sum");
       var price = parseFloat(priceElement.innerText.replace("元", '')); //取出文字內容(避用.textContent 顯示隱藏元素內容)，移除字串元+把剩下字串轉換成浮點數
       var qty = parseInt(input.value, 10);                              //慣例-價格:字串轉換浮點數 、數量:字串轉換整數
       var totalSum = price * qty;  
       sumElement.innerText = totalSum + "元";
    }
    /*更新 所有商品總價: 取得所有節點 初始值 對每一商品:轉換 計算加總 單獨顯示*/
    //累加器設計: 先宣告變數初始化值為0  用迴圈計算累加
    function updateTotalAmount() {
       var sumElements = document.querySelectorAll(".sum");
       var totalAmount = 0;
       sumElements.forEach(function(sumElement) {
           var amount = parseFloat(sumElement.innerText.replace("元", ''));
           totalAmount += amount;
       });
       document.querySelector(".totalAmount").innerText = "商品總計：NT$" + totalAmount; //不能寫totalAmount.innerText ，因這個變數的值為數字 非html元。操作DOM需先取得元素節點
    }
    /*更新結帳資訊所有內容*/
    function updateCheckout() {
        /*於不同位置再次顯示商品總計: 取得節點文字內容&轉換  找要顯示地方 顯示 */
            //避函式中調用另一函式來更新頁面資訊 (此處將使購物車頁面vs結帳頁面的商品總價格不一致)
        var totalAmountText = document.querySelector(".totalAmount").innerText;
        var totalAmount = parseFloat(totalAmountText.match(/[\d\.]+/)[0]); //特別取出所有字串的首個由一或多個數字或小數點組成序列，轉換浮點數
                                                                         //.match() 是String的方法。參數放正則表達式、返回包含所有匹配結果的陣列or null
                                                                         // /[\d\.]+/是正則表達式。 \d 代表任何數字 \.轉義小數點  +代表一或多個 [0]取得匹配結果陣列的首個元素
        var checkoutTotalAmountElement = document.querySelector("#containerCheckout #totalAmount");
        checkoutTotalAmountElement.innerText = `商品總計:NT$ ${totalAmount.toFixed(2)}`;
        /*運費:   取得元素節點的值 判斷$選擇   顯示*/
        var deliveryMethod = document.getElementById("deliveryMethod").value;
        var shippingRate = 0;
        if (deliveryMethod === "宅配") {
            shippingRate = 80;
        }
       document.getElementById("shippingRate").innerText = `運費:NT$ ${shippingRate.toFixed(2)}`;
        /*訂單總計: 加總商品總價+運費  處理優惠碼(取得元素節點的值 判斷,成立再打折)  顯示 */
        var orderTotal = totalAmount + shippingRate;
        var promotionCode = document.getElementById('promotionCode').value;
        if (promotionCode && promotionCode.length === 8) {
           orderTotal *= 0.8; 
        }
        document.getElementById("orderSummary").innerText = `訂單合計:NT$ ${orderTotal.toFixed(2)}`;
    }

/*四、送出訂單鈕，跳出模態框*/ 
    var orderModal = document.getElementById("orderModal");  
    orderModal.style.display = "none";                       //點開頁面(初始化) 為隱藏狀態
    //點按鈕開啟
    document.getElementById("submit-btn").onclick = function() {
        document.getElementById("orderModal").style.display = "flex";
    }
    //關閉方式: 點內部叉叉  或 頁面任一處
    document.querySelector(".close-button").onclick = function() { //僅一個叉鈕,可逕用.querySelector //亦可寫document.getElementsByClassName("close-button")[0].onclick 來從物件找首個元素
        orderModal.style.display = "none";
    }
    orderModal.onclick = function(event) {
        if (event.target == orderModal) {                   //若用===則嚴格檢視型別 //此物均為DOM 元素，也可===
            orderModal.style.display = "none";
        }
    }
/*信用卡到期日(輸入數字格式化): 取得節點  監聽輸入事件 執行函式(排除非數字&找前4個 月2+年2 顯示值)*/ 
    document.getElementById('expiryDate').addEventListener('input', function (e) { //只一處使用DOM: 併寫取得元素節點+事件監聽程式 VS多次查詢DOM =先宣告變數來儲存
        var input = e.target.value.replace(/\D/g, '').substring(0,4); //先取得值(（e.target.value） 
                                                                     /*.replace() 是string的方法,在字串中替換子字串。參數(被替換的模式，要替換成的字串)
                                                                        正則表達式 /\D/g  : \D表示非數字字串  g 表示全局搜索所有字串
                                                                        替換成空字串 = 刪除原本所有非數字字串 */
                                                                    /* .substring()是string的方法,從字串中提取一個子字串。參數(起始位置 含，結束位置 不含) 此處提取字串前4個字符*/
        var month = input.substring(0, 2); 
        var year = input.substring(2, 4); 
        e.target.value = month + (year.length > 0 ? '/' + year : ''); /*三元運算符
                                                                     判斷year長度大於0?  true返回month後面先加/ false返回空字串,不多加內容 */ 
    }); 
});


