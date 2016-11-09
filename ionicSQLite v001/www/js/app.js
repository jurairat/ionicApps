(function () {
    var db;
    var app = angular.module('starter', ['ionic', 'ngCordova', 'jett.ionic.filter.bar','formlyIonic','angularMoment']);
    app.run(function ($ionicPlatform, $cordovaSQLite) {
        $ionicPlatform.ready(function () {
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
            
            if (window.cordova) {
            db = $cordovaSQLite.openDB({name: "attend", location: 1}); //device
        }else{
            db = window.openDatabase("attend", "1.0", "sqlite", 1024 * 1024 * 100); // browser
        } 
            //$cordovaSQLite.execute(db,"DROP TABLE course");
            //$cordovaSQLite.execute(db,"DROP TABLE student");
            //$cordovaSQLite.execute(db,"DROP TABLE class");
            //$cordovaSQLite.execute(db,"DROP TABLE status");
            $cordovaSQLite.execute(db,"CREATE TABLE IF NOT EXISTS course (id INTEGER PRIMARY KEY AUTOINCREMENT, courseid text, coursename text, alias text, section integer, pic text)");
            $cordovaSQLite.execute(db,"CREATE TABLE IF NOT EXISTS student(id integer primary key AUTOINCREMENT, stdid text, stdname text, stdlastname text, stdgender text, cid integer, section integer)");
            $cordovaSQLite.execute(db,"CREATE TABLE IF NOT EXISTS class(id integer primary key AUTOINCREMENT, datestime text, cid integer, courseid text, section integer)");
            $cordovaSQLite.execute(db,"CREATE TABLE IF NOT EXISTS status(id integer primary key AUTOINCREMENT, statusname text, cid integer)");
      });
    });
    app.config(function ($stateProvider, $urlRouterProvider,$ionicConfigProvider) {
        $stateProvider
                .state('home', {
                    url: '/home',
                    templateUrl: 'templates/home.html',
                    controller: 'homeCtrl'
                })
                .state('course',{
                    url:'/course/:id/:courseid/:section/:alias',
                    templateUrl:'templates/course.html',
                    controller: 'courseCtrl'
                })
                .state('course.students',{
                  url:'/students',
                  controller: 'courseCtrl',
                  views:{
                    'tab-students':{
                    templateUrl: 'templates/students.html'
                    }
                  }
                })
                .state('course.classattend',{
                  url:'/classattend',
                  controller: 'courseCtrl',
                  views:{
                    'tab-class':{
                    templateUrl: 'templates/classattend.html'
                    }
                  }
                })
                .state('eachclass',{
                    url:'/eachclass/:id/:courseid/:section/:datestime',
                    templateUrl:'templates/eachclass.html',
                    controller: 'courseCtrl'
                });
          $ionicConfigProvider.tabs.position('bottom');

        $urlRouterProvider.otherwise('/home');



    });
    app.controller('homeCtrl', function ($state,$ionicLoading,$scope, $cordovaSQLite, $ionicModal, $ionicFilterBar, $timeout, $ionicPopup,$location,$ionicPopover) {
        $scope.post = {};
        $scope.put = {};
        var filterBarInstance;
        $ionicLoading.show({
            template: 'Loading...'
        });
        $timeout(function () {
            $ionicLoading.hide();
            getList();
        }, 1000);

        $ionicPopover.fromTemplateUrl('templates/popovercourse.html', {
            scope: $scope
        }).then(function(popover) {
            $scope.popCourse = popover;
        });
        $scope.closeCourse = function () {
            $scope.popCourse.hide();
        };
        $scope.$on('$destroy', function() {
            $scope.popCourse.remove();
        });


        $scope.add = function () {
            $scope.number = parseInt((Math.random() * (10 - 1 + 1)), 10) + 1;
            $scope.post.pic = "img/image"+$scope.number+".png";
            
            var data = [];
            angular.forEach($scope.post, function (element) {
                data.push(element);
            });

            var query = "INSERT INTO course (courseid,coursename,alias,section,pic) VALUES (?,?,?,?,?)";
            $cordovaSQLite.execute(db, query, data).then(function () {
                $ionicPopup.alert({
                    title: "ข้อมูล",
                    template: "เพิ่มรายวิชาเรียบร้อยแล้วค่ะ",
                    buttons: [
                    {
                      text: '<b>OK</b>',
                      type: 'button-positive',
                      onTap: function() {
                      $scope.closeAdd();
                      }
                    }
                    ]
                });
                
                /*var query1 = "CREATE TABLE "+ $scope.post.courseid + " (id INTEGER PRIMARY KEY AUTOINCREMENT, stdid integer, courseid text, section integer, datetime text, status text)";
                alert(query1);
                $cordovaSQLite.execute(db,query1);*/
                createTable($scope.post.courseid,$scope.post.section);
                $scope.post = {};
                getList();
                

            }, function (err) {
                console.log(err.message);
            });
            
        };
        
        $scope.edit = function () {
            var query = "update course set courseid = ?,coursename=?,alias=?, section =? where id=?";
            $cordovaSQLite.execute(db, query, [
                $scope.put.courseid,
                $scope.put.coursename,
                $scope.put.alias,
                $scope.put.section,
                $scope.put.id
            ]).then(function () {
                $ionicPopup.alert({
                    title: "ข้อความ",
                    template: "แก้ไขรายวิชาเรียบร้อยแล้วค่ะ",
                    scope: $scope,
                    buttons: [
                    {
                      text: '<b>OK</b>',
                      type: 'button-positive',
                      onTap: function() {
                      $scope.closeEdit();
                      }
                    }
                    ]
                });
                getList();
            }, function (err) {
                console.log(err.message);
            });
        };
        
        function getList() {
            $cordovaSQLite.execute(db, 'SELECT * FROM course').then(function (res) {
                $scope.datas = [];
                for (var i = 0; i < res.rows.length; i++) {
                    $scope.datas.push(res.rows.item(i));
                }

            }, function (err) {
                console.log(err.message);
            });
        };

        function createTable(courseid,section) {
            $cordovaSQLite.execute(db, 'SELECT id FROM course where courseid = ? and section = ?',[courseid,section]).then(function (res) {
                $scope.id = [];
                for (var i = 0; i < res.rows.length; i++) {
                    $scope.id.push(res.rows.item(i).id);
                }
                var query1 = "CREATE TABLE course_"+ $scope.id + "_" + section + " (id INTEGER PRIMARY KEY AUTOINCREMENT, stdid integer, cid integer, section integer, datestime text, status text)";
                $cordovaSQLite.execute(db,query1);
                insertStatus($scope.id);
            }, function (err) {
                console.log(err.message);
            });
            //var query1 = "CREATE TABLE "+ $scope.id + " (id INTEGER PRIMARY KEY AUTOINCREMENT, stdid integer, courseid text, section integer, datetime text, status text)";
            //alert(query1);
        };

        function insertStatus(id) {
            $cordovaSQLite.execute(db, "INSERT INTO status (statusname, cid) VALUES (?,?)", ["มาเรียน", id]);
            $cordovaSQLite.execute(db, "INSERT INTO status (statusname, cid) VALUES (?,?)", ["ขาดเรียน", id]);
            $cordovaSQLite.execute(db, "INSERT INTO status (statusname, cid) VALUES (?,?)", ["สาย", id]);
            $cordovaSQLite.execute(db, "INSERT INTO status (statusname, cid) VALUES (?,?)", ["ลา", id]);
/*            $cordovaSQLite.execute(db, "INSERT INTO status (statusname, cid) VALUES (?,?)", ["มาเรียน", id]).then(function(res) {
                alert("insertStatus: ");
            }, function (err) {
                console.log(err.message);
            });*/
        };

        $ionicModal.fromTemplateUrl('templates/add.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modalAdd = modal;
        });
        $ionicModal.fromTemplateUrl('templates/edit.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modalEdit = modal;
        });
        $scope.closeEdit = function () {
            $scope.modalEdit.hide();
        };
        $scope.closeAdd = function () {
            $scope.modalAdd.hide();
        };
        $scope.goAdd = function () {
            $scope.modalAdd.show();
        };
        $scope.showFilterBar = function () {
            filterBarInstance = $ionicFilterBar.show({
                items: $scope.datas,
                update: function (filteredItems) {
                    $scope.datas = filteredItems;
                }
            });
        };
        $scope.refreshItems = function () {
            if (filterBarInstance) {
                filterBarInstance();
                filterBarInstance = null;
            }
            $timeout(function () {
                getList();
                $scope.$broadcast('scroll.refreshComplete');
            }, 1000);
        };

        $scope.click = function(data){
            
            $scope.link = "#/course/" + data.id + "/" + data.courseid + "/" + data.section + "/" +data.alias + "/students"; 
            //$scope.link = "#/course/" + data.id + "/" + data.courseid + "/" + data.section + "/" +data.alias; 
            window.location.href= $scope.link;
            
        };
/*        $scope.click = function (data) {
            $ionicPopup.show({
                title: 'Confirm',
                template: "what is your choice ?",
                buttons: [
                    {
                        text: 'Delete',
                        type: 'button-assertive',
                        onTap: function () {
                            var query = "delete from course where id = ?";
                            $cordovaSQLite.execute(db, query, [data.id]).then(function () {
                                $ionicPopup.alert({
                                    title: "Information",
                                    template: "Delete data success",
                                    okText: 'Ok',
                                    okType: 'button-positive'
                                });
                                getList();
                            }, function (err) {
                                console.log(err.message);
                            });
                        }
                    },
                    {
                        text: 'Edit',
                        type: 'button-positive',
                        onTap: function () {
                            $scope.put = data;
                            $scope.modalEdit.show();
                        }
                    }
                ]
            });
        };*/

        $scope.editCourse = function(data){
          $scope.put = data;
          $scope.modalEdit.show();
        };

        $scope.deleteCourse = function(data){
        
          $ionicPopup.show({
                title: 'ยืนยันการลบ',
                template: "คุณแน่ใจที่จะลบรายวิชานี้ใช่หรือไม่",
                buttons: [
                    {
                        text: 'ยืนยัน',
                        type: 'button-assertive',
                        onTap: function () {
                            var q1 = "DROP TABLE course_"+ data.id + "_" + data.section;
                            $cordovaSQLite.execute(db, q1);
                            var q2 = "DELETE FROM class where cid = ? and section = ?";
                            $cordovaSQLite.execute(db, q2, [data.id,data.section]);
                            var q3 = "DELETE FROM student where cid = ? and section =?";
                            $cordovaSQLite.execute(db, q3, [data.id,data.section])
                            var q4 = "DELETE FROM course where id = ?";
                            $cordovaSQLite.execute(db, q4, [data.id])
                            getList();

                            /*var query = "delete from course where id = ?";
                            $cordovaSQLite.execute(db, query, [data.id]).then(function () {
                                getList();
                            }, function (err) {
                                console.log(err.message);
                            });*/
                        }
                    },
                    {
                        text: 'ยกเลิก',
                        type: 'button-positive',
                        onTap: function () {
                            //$scope.modalEdit.show();
                        }
                    }
                ]
            });
        };

          $scope.deleteAllCourse = function(){
            $scope.closeCourse();
            if($scope.datas.length === 0){
                $ionicPopup.show({
                    title: 'ข้อความแจ้งเตือน',
                    template: "ขณะนี้ไม่มีรายวิชาให้ลบ",
                    buttons: [
                        {
                            text: 'ตกลง',
                            type: 'button-positive',
                            onTap: function () {
                            }
                        }
                    ]
                });
            }// end if
            else{
                $ionicPopup.show({
                    title: 'ยืนยันการลบ',
                    template: "คุณแน่ใจที่จะลบรายวิชาทั้งหมดนี้ใช่หรือไม่",
                    buttons: [
                        {
                            text: 'ยืนยัน',
                            type: 'button-assertive',
                            onTap: function () {
                                for (var i = 0; i < $scope.datas.length; i++) {
                                    alert($scope.datas[i].id);
                                    var q1 = "DROP TABLE course_"+ $scope.datas[i].id + "_" + $scope.datas[i].section;
                                    $cordovaSQLite.execute(db, q1);
                                    var q2 = "DELETE FROM class where cid = ? and section = ?";
                                    $cordovaSQLite.execute(db, q2, [$scope.datas[i].id,$scope.datas[i].section]);
                                    var q3 = "DELETE FROM student where cid = ? and section =?";
                                    $cordovaSQLite.execute(db, q3, [$scope.datas[i].id,$scope.datas[i].section])
                                    var q4 = "DELETE FROM course where id = ?";
                                    $cordovaSQLite.execute(db, q4, [$scope.datas[i].id])
                                }
                                getList();


/*                                var q1 = "DELETE FROM course_"+ $scope.cid + "_" + $scope.section;
                                var q2 = "DELETE FROM student";
                                $cordovaSQLite.execute(db, q1);
                                $cordovaSQLite.execute(db, q2);
                                getList();*/
                            }
                        },
                        {
                            text: 'ยกเลิก',
                            type: 'button-positive',
                            onTap: function () {
                                //$scope.modalEdit.show();
                            }
                        }
                    ]
                });
            } // end else
        
    };

    $scope.Reset = function(){
        $scope.closeCourse();
        $ionicPopup.show({
                    title: 'ยืนยันการรีเซต',
                    template: "คุณแน่ใจที่จะรีเซตข้อมูลทั้งหมดเหมือนตอนเริ่มต้นเปิดโปรแกรมใช่หรือไม่",
                    buttons: [
                        {
                            text: 'ยืนยัน',
                            type: 'button-assertive',
                            onTap: function () {
                                //$cordovaSQLite.execute(db, "select 'drop table ' || name from sqlite_master where type = ?",["table"]).then(function (res) {
                                
                                $cordovaSQLite.execute(db, "select name from sqlite_master where type = ?",["table"]).then(function (res) {
                                    //alert("hello");
                                    $scope.droptables = [];
                                    for (var i = 0; i < res.rows.length; i++) {
                                        $scope.droptables.push(res.rows.item(i));
                                        alert($scope.droptable[i].name);

                                        var query = "DROP TABLE " + $scope.droptables[i].name;
                                        alert(query);
                                        /*$cordovaSQLite.execute(db,query).then(function (res) {
                                        }, function (err) {
                                            console.log(err.message);   
                                        });*/
                                    }// end for
                                    $cordovaSQLite.execute(db,"CREATE TABLE IF NOT EXISTS course (id INTEGER PRIMARY KEY AUTOINCREMENT, courseid text, coursename text, alias text, section integer, pic text)");
                                    $cordovaSQLite.execute(db,"CREATE TABLE IF NOT EXISTS student(id integer primary key AUTOINCREMENT, stdid text, stdname text, stdlastname text, stdgender text, cid integer, section integer)");
                                    $cordovaSQLite.execute(db,"CREATE TABLE IF NOT EXISTS class(id integer primary key AUTOINCREMENT, datestime text, cid integer, courseid text, section integer)");
                                    $cordovaSQLite.execute(db,"CREATE TABLE IF NOT EXISTS status(id integer primary key AUTOINCREMENT, statusname text, cid integer)");
                                    getList();
                                    //alert(JSON.stringify($scope.droptables));
                                }, function (err) {
                                    console.log(err.message);
                                });
/*                                $cordovaSQLite.execute(db,"DROP TABLE course");
                                $cordovaSQLite.execute(db,"DROP TABLE student");
                                $cordovaSQLite.execute(db,"DROP TABLE class");
                                $cordovaSQLite.execute(db,"DROP TABLE status");*/

                                


                            }
                        },
                        {
                            text: 'ยกเลิก',
                            type: 'button-positive',
                            onTap: function () {
                                //$scope.modalEdit.show();
                            }
                        }
                    ]
                });
    };

    }); //end controller



    
  // Add Student and Check Class Attandance.
    app.controller('courseCtrl',function ($state,$ionicLoading,$scope, $cordovaSQLite, $ionicModal,$ionicPopover, $ionicFilterBar, $timeout, $ionicPopup,$location,$cordovaDatePicker,$ionicPlatform,$cordovaBarcodeScanner,$ionicHistory){

        $scope.cid = $state.params.id;
        $scope.courseid = $state.params.courseid;
        $scope.section = $state.params.section;
        $scope.alias = $state.params.alias;
        $scope.dt = $state.params.datestime;
        
        $scope.post = {};
        $scope.put = {};

        var filterBarInstance;
        $ionicLoading.show({
            template: 'Loading...'
        });
        $timeout(function () {
            $ionicLoading.hide();
            getList();
            getListClass();
            getListAll();
        }, 100);
        
        $scope.add = function () {            
            var data = [];
            $scope.post.cid = $scope.cid;
            $scope.post.section = $scope.section;
            angular.forEach($scope.post, function (element) {
                data.push(element);
            });
            var query = "INSERT INTO student (stdid,stdname,stdlastname,stdgender,cid,section) VALUES (?,?,?,?,?,?)";
            $cordovaSQLite.execute(db, query, data).then(function () {
                $ionicPopup.alert({
                    title: "ข้อมูล",
                    template: "เพิ่มนักศึกษาเรียบร้อยแล้วค่ะ",
                    buttons: [
                    {
                      text: '<b>OK</b>',
                      type: 'button-positive',
                      onTap: function() {
                      $scope.closeAdd();
                      }
                    }
                    ]
                });
                //alert(data[0]);
                insertStudent(data[0]);
                $scope.post = {};
                getList();
                //$state.go($state.current, {}, {reload: true});
                //getListClass();
            }, function (err) {
                console.log(err.message);
            });
        };

        $scope.edit = function () {
            var query = "update student set stdid = ?, stdname = ?, stdlastname = ?, stdgender = ? where id = ? and section = ? and cid = ?";
            $cordovaSQLite.execute(db, query, [
                $scope.put.stdid,
                $scope.put.stdname,
                $scope.put.stdlastname,
                $scope.put.stdgender,
                $scope.put.id,
                $scope.put.section,
                $scope.put.cid
            ]).then(function () {
                $ionicPopup.alert({
                    title: "ข้อความ",
                    template: "แก้ไขรายวิชาเรียบร้อยแล้วค่ะ",
                    scope: $scope,
                    buttons: [
                    {
                      text: '<b>OK</b>',
                      type: 'button-positive',
                      onTap: function() {
                      $scope.closeEdit();
                      }
                    }
                    ]
                });
                getList();
            }, function (err) {
                console.log(err.message);
            });
        };
        
        function getList() {
            $cordovaSQLite.execute(db, 'SELECT * FROM student where cid = ? and section =? order by stdid asc, stdname asc',[$scope.cid,$scope.section]).then(function (res) {
                $scope.datas = [];
                for (var i = 0; i < res.rows.length; i++) {
                    $scope.datas.push(res.rows.item(i));
                }
            }, function (err) {
                console.log(err.message);
            });
        };

        function getListAll(){
            $scope.alldatas = [];
            var query = "SELECT * FROM course_" + $scope.cid + "_" + $scope.section + " inner join student on (course_" + $scope.cid + "_" + $scope.section + ".stdid = student.id) where course_" + $scope.cid + "_" + $scope.section + ".cid = ? and course_" + $scope.cid + "_" + $scope.section + ".section = ? and datestime = ?";
            //alert(query);
            $cordovaSQLite.execute(db, query ,[$scope.cid,$scope.section,$scope.dt]).then(function (res) {
                for (var i = 0; i < res.rows.length; i++) {
                    $scope.alldatas.push(res.rows.item(i));
                }
                //alert($scope.alldatas[0].status);
                //alert(JSON.stringify($scope.alldatas));
            }, function (err) {
                console.log(err.message);
            });
        };

        function getStdandStatus(stid) {
            $scope.st = [];
            var q1 = "SELECT * FROM course_" + $scope.cid + "_" + $scope.section + " where stdid = ? and cid = ? and section = ? and datestime = ?";
            //alert(q1);
            //$cordovaSQLite.execute(db, q1).then(function (res) {
            $cordovaSQLite.execute(db, q1 ,[stid,$scope.cid,$scope.section,$scope.dt]).then(function (res) {
                //$scope.st = [];
                for (var i = 0; i < res.rows.length; i++) {
                    $scope.st.push(res.rows.item(i));
                }
                //alert($scope.st[0].status);
                //alert(JSON.stringify($scope.st));
            }, function (err) {
                console.log(err.message);
            });

            $cordovaSQLite.execute(db, 'SELECT * FROM student where cid = ? and section = ?',[$scope.cid,$scope.section]).then(function (res) {
                $scope.dataAll = [];
                for (var i = 0; i < res.rows.length; i++) {
                    $scope.dataAll.push(res.rows.item(i));
                    angular.forEach($scope.dataAll, function(obj){
                        obj["status"] = $scope.st[0].status;
                    });
                }
                //alert(JSON.stringify($scope.dataAll));

            }, function (err) {
                console.log(err.message);
            });
        };

        $scope.getGender = function(gender){
            $scope.post.stdgender = gender;
        };
        $scope.updateGender = function(gender){
            $scope.put.stdgender = gender;
        };
        $ionicModal.fromTemplateUrl('templates/addstudent.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modalAdd = modal;
        });
        $ionicModal.fromTemplateUrl('templates/editstudent.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modalEdit = modal;
        });
        $ionicPopover.fromTemplateUrl('templates/status.html', {
            scope: $scope
        }).then(function (popover) {
            $scope.popStatus = popover;
        });
        $ionicPopover.fromTemplateUrl('templates/popoverclass.html', {
            scope: $scope
        }).then(function(popover) {
            $scope.popClass = popover;
        });
        $ionicPopover.fromTemplateUrl('templates/popoverstudent.html', {
            scope: $scope
        }).then(function(popover) {
            $scope.popStudent = popover;
        });


        $scope.closeEdit = function () {
            $scope.modalEdit.hide();
        };
        $scope.closeAdd = function () {
            $scope.modalAdd.hide();
        };
        $scope.closeStatus = function () {
            $scope.popStatus.hide();
        };
        $scope.$on('$destroy', function() {
            $scope.popStatus.remove();
        });
        $scope.$on('popover.hidden', function() {
        
        });
        $scope.$on('popover.removed', function() {

        });

        $scope.closeClass = function () {
            $scope.popClass.hide();
        };
        $scope.$on('$destroy', function() {
            $scope.popClass.remove();
        });

        $scope.closeStudent = function () {
            $scope.popStudent.hide();
        };
        $scope.$on('$destroy', function() {
            $scope.popStudent.remove();
        });

        $scope.goAdd = function () {
            $scope.modalAdd.show();
        };
        $scope.goCheck = function (info,stid){

            var query = "update course_" + $scope.cid + "_" + $scope.section + " set status = ? where stdid = ? and cid = ? and section = ? and datestime = ?";
            $cordovaSQLite.execute(db, query, [ info,stid,$scope.cid,$scope.section,$scope.dt]).then(function(res) {
                //alert('UPDATED');
            }, function (err) {
                alert('ERROR จิงๆนะ ' + err.message);
            });

            getStdandStatus(stid);
            getListAll();
            $scope.closeStatus();
            


        };
        $scope.goStatus = function ($event,studentid) {
            $cordovaSQLite.execute(db, 'SELECT * FROM status where cid = ?',[$scope.cid]).then(function (res) {
                $scope.dataStatus = [];
                for (var i = 0; i < res.rows.length; i++) {
                    $scope.dataStatus.push(res.rows.item(i));
                    angular.forEach($scope.dataStatus, function(obj){
                        obj["stdid"] = studentid;
                    });
                }
                
                //alert(JSON.stringify($scope.dataStatus));

                }, function (err) {
                    console.log(err.message);
            });
            $scope.popStatus.show($event);
        };
        $scope.showFilterBar = function () {
            $scope.closeStudent();
            filterBarInstance = $ionicFilterBar.show({
                items: $scope.datas,
                update: function (filteredItems) {
                    $scope.datas = filteredItems;
                }
            });
        };
        $scope.showFilterBarClass = function () {
            $scope.closeClass();
            filterBarInstance = $ionicFilterBar.show({
                items: $scope.dataClass,
                update: function (filteredItems) {
                    $scope.dataClass = filteredItems;
                }
            });
        };
        $scope.refreshItems = function () {
            if (filterBarInstance) {
                filterBarInstance();
                filterBarInstance = null;
            }
            $timeout(function () {
                getList();
                $scope.$broadcast('scroll.refreshComplete');
            }, 1000);
        };
        $scope.refreshItemsClass = function () {
            if (filterBarInstance) {
                filterBarInstance();
                filterBarInstance = null;
            }
            $timeout(function () {
                getListClass();
                $scope.$broadcast('scroll.refreshComplete');
            }, 1000);
        };
        $scope.refreshItemsAll = function () {
            if (filterBarInstance) {
                filterBarInstance();
                filterBarInstance = null;
            }
            $timeout(function () {
                getListAll();
                $scope.$broadcast('scroll.refreshComplete');
            }, 1000);
        };
        $scope.goBack = function() {
          $state.go('home');
        };

        $scope.goClassAttend = function() {
           //$ionicHistory.backView().go();
           $scope.link1 = "#/course/" + $scope.cid + "/" + $scope.courseid + "/" + $scope.section + "/" + $scope.alias + "/classattend"; 
            window.location.href= $scope.link1;
        };

        $scope.click = function(data){
            //getListAll(data.datestime);
            $scope.link = "#/eachclass/" + $scope.cid + "/" + $scope.courseid + "/" + $scope.section + "/" + data.datestime; 
            //window.location.href= $scope.link;
            //alert($scope.link);
            //alert(data.datestime);
            getListAll();
            $ionicHistory.clearCache().then(function(){ window.location.href= $scope.link; });
            //refreshItems();
            //refreshItemsAll();
            
            //getListAll(data.datestime);
        };

        $scope.editStudent = function(data){
          $scope.put = data;
          $scope.modalEdit.show();
        };

        $scope.deleteStudent = function(data){
        
          $ionicPopup.show({
                title: 'ยืนยันการลบ',
                template: "คุณแน่ใจที่จะลบนักศึกษาใช่หรือไม่",
                buttons: [
                    {
                        text: 'ยืนยัน',
                        type: 'button-assertive',
                        onTap: function () {
                            
                            var q1 = "DELETE FROM course_"+ $scope.cid + "_" + $scope.section + " where stdid = ?";
                            $cordovaSQLite.execute(db, q1, [data.id]);
                            var q2 = "delete from student where id = ? and cid = ? and section = ?";
                            $cordovaSQLite.execute(db, q2, [data.id,$scope.cid,$scope.section]);
                            getList();
                        }
                    },
                    {
                        text: 'ยกเลิก',
                        type: 'button-positive',
                        onTap: function () {
                            //$scope.modalEdit.show();
                        }
                    }
                ]
            });
        };

        $scope.deleteAllStudent = function(){
            $scope.closeStudent();
            if($scope.datas.length === 0){
                $ionicPopup.show({
                    title: 'ข้อความแจ้งเตือน',
                    template: "ขณะนี้ไม่มีรายชื่อนักศึกษาให้ลบ",
                    buttons: [
                        {
                            text: 'ตกลง',
                            type: 'button-positive',
                            onTap: function () {
                            }
                        }
                    ]
                });
            }// end if
            else{
                $ionicPopup.show({
                    title: 'ยืนยันการลบ',
                    template: "คุณแน่ใจที่จะลบรายชื่อนักศึกษาทั้งหมดนี้ใช่หรือไม่",
                    buttons: [
                        {
                            text: 'ยืนยัน',
                            type: 'button-assertive',
                            onTap: function () {
                                var q1 = "DELETE FROM course_"+ $scope.cid + "_" + $scope.section;
                                var q2 = "DELETE FROM student where cid = ? and section = ?";
                                $cordovaSQLite.execute(db, q1);
                                $cordovaSQLite.execute(db, q2,[$scope.cid,$scope.section]);
                                getList();
                            }
                        },
                        {
                            text: 'ยกเลิก',
                            type: 'button-positive',
                            onTap: function () {
                                //$scope.modalEdit.show();
                            }
                        }
                    ]
                });
            } // end else
        
    };

  $ionicPlatform.ready(function(){
    $scope.dateValue = '';
    $scope.minDate =  moment().locale('th').subtract(90, 'years').toDate();
    $scope.showDatePicker = function(){
       var options = {
          date: new Date(),
          mode: 'datetime', // or 'time' // 'datetime'
          minDate: $scope.minDate,
          //minDate: new Date() - 10000,
          allowOldDates: true,
          allowFutureDates: false,
          doneButtonLabel: 'DONE',
          doneButtonColor: '#F2F3F4',
          cancelButtonLabel: 'CANCEL',
          cancelButtonColor: '#000000'
       };

/*       $cordovaDatePicker.show(options).then(function(date){
          //$scope.dataValue = $filter('date')(new Date(date));
          $scope.dateValue = date;
       });
       alert(dateValue);
       //addClass($scope.dateValue);*/
    

        document.addEventListener("deviceready", function () {

            $cordovaDatePicker.show(options).then(function(date){
                $scope.dateValue = date;
                //alert($scope.dateValue);
                var query = "INSERT INTO class (datestime,cid,courseid,section) VALUES (?,?,?,?)";
                $cordovaSQLite.execute(db, query, [$scope.dateValue,$scope.cid,$scope.courseid,$scope.section]).then(function(res) {
                    alert('INSERTED');
                    insertStdtoClass($scope.dateValue);
                    getListClass();
    
                }, function (err) {
                    alert('ERROR จิงๆนะ ' + err.message);
                });
            });
            

        }, false);
        

    };
  });

    $scope.sortClass = function(data) {
        var date = new Date(data.datestime);
        return date;
    };

    function insertStdtoClass(dtValue){
        $cordovaSQLite.execute(db, 'SELECT * FROM student where cid = ? and section =?',[$scope.cid,$scope.section]).then(function (res) {
                for (var i = 0; i < res.rows.length; i++) {
                    $scope.sid = res.rows.item(i)['id'];
                    //var query = "update course_" + $scope.cid + "_" + $scope.section + " set datestime = ? where stdid = ? and cid = ? and section = ?";
                    var query = "INSERT INTO course_" + $scope.cid + "_" +$scope.section + " (stdid, cid, section, datestime) VALUES (?,?,?,?)";
                    //$cordovaSQLite.execute(db, query, [dtValue, $scope.sid, $scope.cid, $scope.section]).then(function(res) {
                    $cordovaSQLite.execute(db, query, [$scope.sid, $scope.cid, $scope.section, dtValue]).then(function(res) {    
                        //alert('INSERTED' + i);
                    }, function (err) {
                        alert('ERROR จิงๆนะ ' + err.message);
                    });
                }
        }, function (err) {
            console.log(err.message);
        });
    };

    function insertStudent(stid){
        //$scope.dt = [];
/*        $cordovaSQLite.execute(db, 'SELECT * FROM class where cid = ? and section =?',[$scope.cid,$scope.section]).then(function (res) {
            //$scope.dt = [];
            for (var k = 0; k< res.rows.length; k++){
                $scope.dt.push(res.rows.item(k));
            } // end for
        }, function (err) {
                        console.log(err.message);
        });*/

        $cordovaSQLite.execute(db, 'SELECT * FROM student where stdid = ? and cid = ? and section =?',[stid,$scope.cid,$scope.section]).then(function (res) {
                for (var i = 0; i < res.rows.length; i++) {
                    $scope.sid = res.rows.item(i)['id'];
                    //alert($scope.sid);
                    $cordovaSQLite.execute(db, 'SELECT * FROM class where cid = ? and section =?',[$scope.cid,$scope.section]).then(function (res) {
                        $scope.dt = [];
                        for (var k = 0; k< res.rows.length; k++){
                            $scope.dt.push(res.rows.item(k));
                        } // end for

                        if (res.rows.length > 0){
                            for (var j = 0; j < $scope.dt.length; j++){
                                var q1 = "INSERT INTO course_" + $scope.cid + "_" +$scope.section + " (stdid, cid, section,datestime) VALUES (?,?,?,?)";
                                $cordovaSQLite.execute(db, q1, [$scope.sid, $scope.cid, $scope.section,$scope.dt[j].datestime]).then(function(res) {
                                    //alert('INSERTED datestime');
                                    //alert('INSERTED' + j);
                                    //getListAll($scope.dt[j].datestime);
                                }, function (err) {
                                    alert('ERROR จิงๆนะ ' + err.message);
                                });
                            } // end for
                        } //end if
                        /*else {
                            var q2 = "INSERT INTO course_" + $scope.cid + "_" +$scope.section + " (stdid, cid, section) VALUES (?,?,?)";
                            $cordovaSQLite.execute(db, q2, [$scope.sid, $scope.cid, $scope.section]).then(function(res) {
                                alert('INSERTED empty datestime');
                                //alert('INSERTED' + i);
                            }, function (err) {
                                alert('ERROR จิงๆนะ ' + err.message);
                            });
                        } // end else*/
                    }, function (err) {
                        console.log(err.message);
                    });
                    getListAll();
                } // end for
        }, function (err) {
            console.log(err.message);
        });
        
    };

    function getListClass() {
        $cordovaSQLite.execute(db, 'SELECT * FROM class where cid = ? and section =?',[$scope.cid,$scope.section]).then(function (res) {
            $scope.dataClass = [];
            for (var i = 0; i < res.rows.length; i++) {
                $scope.dataClass.push(res.rows.item(i));
            }
            //alert(JSON.stringify($scope.dataClass));
        }, function (err) {
            console.log(err.message);
        });
    };


    $scope.deleteClass = function(data){
        
          $ionicPopup.show({
                title: 'ยืนยันการลบ',
                template: "คุณแน่ใจที่จะลบช่วงเวลานี้ใช่หรือไม่",
                buttons: [
                    {
                        text: 'ยืนยัน',
                        type: 'button-assertive',
                        onTap: function () {
                            var q1 = "DELETE FROM course_"+ $scope.cid + "_" + $scope.section + " where datestime = ?";
                            $cordovaSQLite.execute(db, q1, [data.datestime]);
                            var q2 = "delete from class where datestime = ?";
                            $cordovaSQLite.execute(db, q2, [data.datestime]);
                            getListClass();
  /*                          $cordovaSQLite.execute(db, q2, [data.datestime]).then(function () {
                                getListClass();
                            }, function (err) {
                                console.log(err.message);
                            });*/
                        }
                    },
                    {
                        text: 'ยกเลิก',
                        type: 'button-positive',
                        onTap: function () {
                            //$scope.modalEdit.show();
                        }
                    }
                ]
            });
        };


    $scope.deleteAllClass = function(){
        $scope.closeClass();
        if($scope.dataClass.length === 0){
            $ionicPopup.show({
                title: 'ข้อความแจ้งเตือน',
                template: "ขณะนี้ไม่มีคาบเรียนให้ลบ",
                buttons: [
                    {
                        text: 'ตกลง',
                        type: 'button-positive',
                        onTap: function () {
                        }
                    }
                ]
            });
        }// end if
        else{
            $ionicPopup.show({
                title: 'ยืนยันการลบ',
                template: "คุณแน่ใจที่จะลบคาบเรียนทั้งหมดนี้ใช่หรือไม่",
                buttons: [
                    {
                        text: 'ยืนยัน',
                        type: 'button-assertive',
                        onTap: function () {
                            var q1 = "DELETE FROM course_"+ $scope.cid + "_" + $scope.section + " where cid = ? and section =?";
                            var q2 = "DELETE FROM class where cid = ? and section = ?";
                            $cordovaSQLite.execute(db, q1,[$scope.cid,$scope.section]);
                            $cordovaSQLite.execute(db, q2,[$scope.cid,$scope.section]);
                            getListClass();
                        }
                    },
                    {
                        text: 'ยกเลิก',
                        type: 'button-positive',
                        onTap: function () {
                            //$scope.modalEdit.show();
                        }
                    }
                ]
            });
        } // end else
        
    };


    $scope.scanBarcode = function() {
        $cordovaBarcodeScanner.scan().then(function(imageData) {
            alert(imageData.text);
            console.log("Barcode Format -> " + imageData.format);
            console.log("Cancelled -> " + imageData.cancelled);
        }, function(error) {
            console.log("An error happened -> " + error);
        });
    };



    }); // end of courseCtrl

})();