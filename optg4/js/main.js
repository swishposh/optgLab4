// Ссылка на элемент веб страницы в котором будет отображаться графика 
var container; 

var keyboard = new THREEx.KeyboardState(); 

var loader = new THREE.TextureLoader();
 
// Переменные "камера", "сцена" и "отрисовщик" 
var camera, scene, renderer, cameraOrtho, sceneOrtho;

var geometry;

var clock = new THREE.Clock();

var sprite;

var N = 256;

var Cursor3D;

var mouse = { x: 0, y: 0 }; //переменная для хранения координат мыши
//массив для объектов, проверяемых на пересечение с курсором
var targetList = []; 

var circle;

var radius = 10;

var brushDirection = 0;

//объект интерфейса и его ширина
var gui = new dat.GUI();
gui.width = 200;

var brVis = false;

//var models = [];
//var models = {};
var models = new Map();

var selected = null;//ccskrf yf ds,hfyysq j,]trn
var objectList = []; 

var lmb = false;

var sprt = null;

var g = new THREE.Vector3 (0, -9.8, 0); //gravitation
var particles = [];
var MAX_PARTICLES = 50000;
var PARTICLES_PER_SECOND = 1000;
var rainMAt = null;
var wind = new THREE.Vector3 (55.0, 0.0, 0.0); //wind

// Функция инициализации камеры, отрисовщика, объектов сцены и т.д. 
init(); 
 
// Обновление данных по таймеру браузера 
animate(); 

// В этой функции можно добавлять объекты и выполнять их первичную настройку 
function init()  
{     
    // Получение ссылки на элемент html страницы     
    container = document.getElementById( 'container' );     
    // Создание "сцены"     
    scene = new THREE.Scene(); 
    sceneOrtho = new THREE.Scene(); 
 
    var width = window.innerWidth ;
    var height = window.innerHeight;

    //создание ортогональной камеры
    cameraOrtho = new THREE.OrthographicCamera( - width / 2, width / 2, height / 2, -
                                                height / 2, 1, 10 );
    cameraOrtho.position.z = 10;

    // Установка параметров камеры     
    // 45 - угол обзора     
    // window.innerWidth / window.innerHeight - соотношение сторон     // 1 - 4000 - ближняя и дальняя плоскости отсечения     
    camera = new THREE.PerspectiveCamera(                                  
        45, window.innerWidth / window.innerHeight, 1, 4000 );     
 
    // Установка позиции камеры     
    camera.position.set(N, N/2, N/0.8);          
    // Установка точки, на которую камера будет смотреть     
    camera.lookAt(new THREE.Vector3( N/2,  0.0, N/2));   
 
    // Создание отрисовщика     
    renderer = new THREE.WebGLRenderer( { antialias: false } );     
    renderer.setSize( window.innerWidth, window.innerHeight );     
    // Закрашивание экрана синим цветом, заданным в 16ричной системе     
    renderer.setClearColor( 0x444444, 1); 

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
 
    container.appendChild( renderer.domElement ); 
 
    // Добавление функции обработки события изменения размеров окна     
    window.addEventListener( 'resize', onWindowResize, false );

    //отключение авто очистки рендера
    renderer.autoClear = false;


    renderer.domElement.addEventListener('mousedown',onDocumentMouseDown,false);
    renderer.domElement.addEventListener('mouseup',onDocumentMouseUp,false);
    renderer.domElement.addEventListener('mousemove',onDocumentMouseMove,false);
    renderer.domElement.addEventListener('wheel',onDocumentMouseScroll,false);

    renderer.domElement.addEventListener("contextmenu",
                                        function (event)
                                        {
                                        event.preventDefault();
                                        });
    
    //свет
    var spotlight = new THREE.DirectionalLight(0xffffff);
    //var spotlight = new THREE.PointLight(0xffff00);
    //position
    spotlight.position.set(N, N, N/2);


    //var targetObject = new THREE.Object3D();
    spotlight.target = new THREE.Object3D();
    spotlight.target.position.set( N/2, 0, N/2 );
    scene.add(spotlight.target);

    //spotlight.target = targetObject;
   
    // направление освещения
    //spotlight.target.position.set( 0, 0, 0 );
    //scene.add(spotlight.target);

    // включение расчёта теней
    spotlight.castShadow = true;
    // параметры области расчёта теней
    ////spotlight.shadow.camera.near = 500;
    ////spotlight.shadow.camera.far = 4000;
    ////spotlight.shadow.camera.fov = 45;

    spotlight.shadow = new THREE.LightShadow( 
        new THREE.PerspectiveCamera( 60, 1, 10, 1000 ) );
        spotlight.shadow.bias = 0.0001;


    // размер карты теней
    spotlight.shadow.mapSize.width = 4096;
    spotlight.shadow.mapSize.height = 4096;

    //add
    scene.add(spotlight);
    //scene.add(pspotlight);

    var helper = new THREE.CameraHelper(spotlight.shadow.camera);
    //scene.add( helper );

    // Пользовательская функция генерации ландшафта     
    terrainGen(); 
    add3DCursor();
    addCircle();

    GUI();

    
    loadModel('models/house/', 'Cyprys_House.obj', 'Cyprys_House.mtl', 3, 'house');
    loadModel('models/palma/', 'Palma001.obj', 'Palma001.mtl', 0.5, 'palma');
    loadModel('models/grade/', 'grade.obj', 'grade.mtl', 3, 'grade');

    
    //cameraOrtho.add(sprt);    
    //updateHUDSprite(sprt);

    addButtons();

    //for (var i=0; i<10; i++)
    //{
       // var pos =new THREE.Vector4 (i*5, 20, N/2);
       // addSprite('pics/sprites/avatan.png', pos);
    //}

    rainMAt = createSpriteMaterial('pics/sprites/avatan.png');

}

function terrainGen()
{
    geometry = new THREE.Geometry();
 
    for (var i=0; i < N; i++)
    for (var j=0; j < N; j++)
    {
        //color
        //var h = getPixel(imagedata, i, j);

        //add coordination in massiv
        geometry.vertices.push(new THREE.Vector3(i, 0.0, j));
    }

    for (var i = 0; i < (N-1); i++)
        for (var j = 0; j < (N-1); j++)
        {
            //add
            geometry.faces.push(new THREE.Face3(i+j*N, (i+1)+j*N, (i+1)+(j+1)*N));
            geometry.faces.push(new THREE.Face3(i+j*N, (i+1)+(j+1)*N, (i)+(j+1)*N));

            geometry.faceVertexUvs[0].push([
                new THREE.Vector2((i)/(N-1), (j)/(N-1)),
                new THREE.Vector2((i+1)/(N-1), (j)/(N-1)),
                new THREE.Vector2((i+1)/(N-1), (j+1)/(N-1))]);

            geometry.faceVertexUvs[0].push([
                new THREE.Vector2((i)/(N-1), (j)/(N-1)),
                new THREE.Vector2((i+1)/(N-1), (j+1)/(N-1)),
                new THREE.Vector2((i)/(N-1), (j+1)/(N-1))]);
        }
        
    geometry.computeFaceNormals();  
    geometry.computeVertexNormals();    
   
    
    var tex = loader.load( 'pics/grasstile.jpg' );

    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
        
    var mat = new THREE.MeshLambertMaterial
    ({    
        map: tex,    
        wireframe: false,    
        side: THREE.DoubleSide 
    });
 
    var mesh = new THREE.Mesh(geometry, mat); 
    mesh.position.set(0.0, 0.0, 0.0);


    mesh.receiveShadow = true;

    //добавление в массив плоскость (ландшафт)
    targetList.push(mesh);
    scene.add(mesh);

}

function onWindowResize()
{
    var width = window.innerWidth ;
    var height = window.innerHeight;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    cameraOrtho.left = - width / 2;
    cameraOrtho.right = width / 2;
    cameraOrtho.top = - height / 2;
    cameraOrtho.bottom = - height / 2;
    cameraOrtho.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate()
{
    // воспроизведение анимаций (в функции animate)
    var delta = clock.getDelta();

    if (brushDirection != 0)
    {
        sphereBrush(brushDirection, delta);
    }

    emitter (delta);

    // Добавление функции на вызов, при перерисовки браузером страницы 
    requestAnimationFrame( animate ); 

    render(); 
}

function render()
{        
    renderer.clear();
    renderer.render( scene, camera );

    renderer.clearDepth();
    renderer.render( sceneOrtho, cameraOrtho );
}


function loadModel(path, oname, mname, s, name)
{
    // функция, выполняемая в процессе загрузки модели (выводит процент загрузки)
    var onProgress = function ( xhr ) {
        if ( xhr.lengthComputable ) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log( Math.round(percentComplete, 2) + '% downloaded' );
        }
    };
    // функция, выполняющая обработку ошибок, возникших в процессе загрузки
    var onError = function ( xhr ) { };

    // функция, выполняющая обработку ошибок, возникших в процессе загрузки
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath( path );

    // функция загрузки материала
    mtlLoader.load( mname, function( materials )
    {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials( materials );
        
        objLoader.setPath( path );
 
        // функция загрузки модели
        objLoader.load( oname, function ( object )
        {
            //mesh.receiveShadow = true; //принимает 
            object.castShadow = true; //только отбрасывает
            //console.log(object);

            object.traverse( function ( child )
            {
                if ( child instanceof THREE.Mesh )
                {
                    child.castShadow = true;
                    child.parent = object;
                }
            } );

            //for (var i=0; i < 100; i++)
            //{
                object.parent = object;
                var x = Math.random() * 256;
                var z = Math.random() * 256;

                var y = geometry.vertices[ Math.round(z) + Math.round(x) * N ].y;

                object.position.x = x;
                object.position.y = y;
                object.position.z = z;
    
                //object.scale.set(1, 1, 1);
                //object.scale.set(0.2, 0.2, 0.2);
                ///var s = (Math.random() * 100) + 30
                ///s /= 400.0;
                object.scale.set(s, s, s);
    

                //scene.add(object);
                //clone
                //scene.add(object.clone());
            //}

                //models.add(name, object)
                models.set(name, object)
                //models.push(object);
            

        }, onProgress, onError );
    });
}

function add3DCursor ()
{
    //параметры цилиндра: диаметр вершины, диаметр основания, высота, число сегментов
    var geometry = new THREE.CylinderGeometry( 1.5, 0, 5, 64 );
    var cyMaterial = new THREE.MeshLambertMaterial( {color: 0x888888} );
    Cursor3D = new THREE.Mesh( geometry, cyMaterial );
    Cursor3D.visible = false;
    scene.add( Cursor3D );
}

function addCircle()
{
    var material = new THREE.LineBasicMaterial( { color: 0xffff00 } );
    
    var segments = 64;
    var circleGeometry = new THREE.CircleGeometry( 1, segments );
    //удаление центральной вершины
    circleGeometry.vertices.shift();


    for (var i=0; i<circleGeometry.vertices.length; i++)
    {
        circleGeometry.vertices[i].z = circleGeometry.vertices[i].y;
        circleGeometry.vertices[i].y = 0;
    }

    circle = new THREE.Line( circleGeometry, material );

    //circle.rotation.x = Math.PI/2;
    circle.scale.set(radius, 1, radius);

    circle.visible = false;

    scene.add( circle ); 
}

function onDocumentMouseScroll( event ) 
{
    if (brVis == true)
    {
        if (radius>1)
            if(event.wheelDelta < 0)
                radius --;

        if (radius<40)
            if(event.wheelDelta > 0)
                radius ++;        

        circle.scale.set(radius, 1, radius);
    }
}

function onDocumentMouseMove( event ) 
{
    var mpos = {};

    mpos.x = event.clientX -( window.innerWidth / 2 );
    mpos.y = ( window.innerHeight / 2 ) - event.clientY;

    if (sprt != null)
    {
        hitButton (mpos, sprt);
        //clickButton (mpos, sprt);
    }
        

    //определение позиции мыши
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

    //создание луча, исходящего из позиции камеры и проходящего сквозь позицию курсора мыши
    var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
    vector.unproject(camera);

    var ray = new THREE.Raycaster( camera.position,
        vector.sub( camera.position ).normalize() );
    
    // создание массива для хранения объектов, с которыми пересечётся луч
    var intersects = ray.intersectObjects( targetList );

    if (brVis == true)
    {
        // если луч пересёк какой-либо объект из списка targetList
        if ( intersects.length > 0 )
        {
            //печать списка полей объекта
            //console.log(intersects[0]);

            if (Cursor3D != null)
            {
                Cursor3D.position.copy(intersects[0].point);
                Cursor3D.position.y += 2.5;
            }

            if (circle != null)
            {
                circle.position.copy(intersects[0].point);
                //circle.position.y += 0.1;
                circle.position.y = 0;

                for (var i = 0; i < circle.geometry.vertices.length; i++)
                {
                    //получение позиции в локальной системе координат
                    var pos = new THREE.Vector3();
                    pos.copy(circle.geometry.vertices[i]);
                    //нахождение позиции в глобальной системе координат
                    pos.applyMatrix4(circle.matrixWorld);

                    var x = Math.round(pos.x);
                    var z = Math.round(pos.z);

                    if(x >= 0 && x < N && z >= 0 && z < N)
                    {
                        var y = geometry.vertices[z + x * N].y;
                        circle.geometry.vertices[i].y = y + 0.03;
                    }else circle.geometry.vertices[i].y = 0;
                }

                circle.geometry.verticesNeedUpdate = true; //обновление вершин
            }
        }
    }
    else
    {
        if ( intersects.length > 0 )
        {
            if (selected != null && lmb == true )
            {
                selected.position.copy(intersects[0].point);

                selected.userData.box.setFromObject(selected);
                //получение позиции центра объекта
                var pos = new THREE.Vector3();
                selected.userData.box.getCenter(pos);

                //получение позиции центра объекта
                selected.userData.obb.position.copy(pos);

                //selected.userData.cube.position.copy(intersects[0].point);
                selected.userData.cube.position.copy(pos);

                for ( var i = 0; i < objectList.length; i++ )
                {
                    if ( selected.userData.cube != objectList[i] )
                    {
                        objectList[i].material.visible = false;
                        objectList[i].material.color = {r:1, g:1, b:0};

                        if ( intersect(selected.userData, 
                            objectList[i].userData.model.userData) == true )
                        {
                            objectList[i].material.color = {r:1, g:0, b:0};
                            //отмена скрытия объекта
                            objectList[i].material.visible = true;
                        }
                    }
                    
                }
            }
                
        }
       
    }
}

function onDocumentMouseDown( event ) 
{
    if (brVis == true)
    {
        console.log(event.which);
        if (event.which == 1)
            brushDirection = 1;
        if (event.which == 3)
            brushDirection = -1;
    }
    else
    {
        lmb = true;
        
        //определение позиции мыши
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

        //создание луча, исходящего из позиции камеры и проходящего сквозь позицию курсора мыши
        var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
        vector.unproject(camera);

        var ray = new THREE.Raycaster( camera.position,
            vector.sub( camera.position ).normalize() );
        
        // создание массива для хранения объектов, с которыми пересечётся луч
        var intersects = ray.intersectObjects( objectList, true );

        // если луч пересёк какой-либо объект из списка targetList
        if ( intersects.length > 0 )
        {
            if (selected != null)
            {
                // скрытия объекта
                selected.userData.cube.material.visible = false;

                selected = intersects[0].object.userData.model;
                //отмена скрытия объекта
                selected.userData.cube.material.visible = true;
            }
            else
            {
                //selected = intersects[0].object.parent; // yf rnh vs gjgfkb rehcjhjv vsib
                selected = intersects[0].object.userData.model;
                //console.log(selected);

                //отмена скрытия объекта
                selected.userData.cube.material.visible = true;
            }
        }
        else
        if ( selected != null )
        {
            // скрытия объекта
            selected.userData.cube.material.visible = false;
            selected = null;
        }
    }
}

function onDocumentMouseUp( event ) 
{
    if (brVis == true)
        brushDirection = 0;
    else 
    {
        // скрытия объекта
        //selected.userData.cube.material.visible = false;
        //selected = null;

        lmb = false;


        var mpos = {};

        mpos.x = event.clientX -( window.innerWidth / 2 );
        mpos.y = ( window.innerHeight / 2 ) - event.clientY;

        if (sprt != null)
        {
            hitButton (mpos, sprt);
            clickButton (mpos, sprt);
        }
    }
}

function sphereBrush(dir, delta)
{
    for (var i = 0; i <geometry.vertices.length; i++)
    {
        var x2 = geometry.vertices[i].x;
        var z2 = geometry.vertices[i].z;
        var r = radius;
        var x1 = Cursor3D.position.x;
        var z1 = Cursor3D.position.z;

        //ℎ = √𝑟2 − ((𝑥2 − 𝑥1)2 + (𝑧2 − 𝑧1)2)

        var h = r*r - (((x2-x1)* (x2-x1))+((z2-z1)*(z2-z1)));
        if(h > 0)
        {
            geometry.vertices[i].y += Math.sqrt(h)*delta * dir;
            //geometry.vertices[i].y += Math.sin(h)*delta * dir;
        }
    }

    geometry.computeFaceNormals();
    geometry.computeVertexNormals(); //пересчёт нормалей
    geometry.verticesNeedUpdate = true; //обновление вершин
    geometry.normalsNeedUpdate = true; //обновление нормалей
}

//2 set
function GUI()
{
    //массив переменных, ассоциированных с интерфейсом
    var params =
    {
        sx: 0, sy: 0, sz: 0,
        brush: false,
        addHouse: function() { addMesh('house') },
        addPalma: function() { addMesh('palma') },
        addGrade: function() { addMesh('grade') },
        //del: function() { delMesh() }
    };

    //создание вкладки
    var folder1 = gui.addFolder('Scale');
    //ассоциирование переменных отвечающих за масштабирование
    //в окне интерфейса они будут представлены в виде слайдера
    //минимальное значение - 1, максимальное – 100, шаг – 1
    //listen означает, что изменение переменных будет отслеживаться
    var meshSX = folder1.add( params, 'sx' ).min(1).max(100).step(1).listen();
    var meshSY = folder1.add( params, 'sy' ).min(1).max(100).step(1).listen();
    var meshSZ = folder1.add( params, 'sz' ).min(1).max(100).step(1).listen();
    //при запуске программы папка будет открыта
    folder1.open();
    //описание действий совершаемых при изменении ассоциированных значений
   //meshSX.onChange(function(value) {…});
    //meshSY.onChange(function(value) {…});
    //meshSZ.onChange(function(value) {…});
    //добавление чек бокса с именем brush
    var cubeVisible = gui.add( params, 'brush' ).name('brush').listen();

    cubeVisible.onChange(function(value)
    {
        // value принимает значения true и false
        brVis = value;
        Cursor3D.visible = value;
        circle.visible = value;
    });

    //добавление кнопок, при нажатии которых будут вызываться функции addMesh
    //и delMesh соответственно. Функции описываются самостоятельно.
    gui.add( params, 'addHouse' ).name( "add house" );
    gui.add( params, 'addPalma' ).name( "add palma" );
    gui.add( params, 'addGrade' ).name( "add grade" );
    //gui.add( params, 'del' ).name( "delete" );

    //при запуске программы интерфейс будет раскрыт
    gui.open();

}


function addMesh (name)
{
    //console.log(models.get(name));
    //scene.add(models.get(name).clone());

    var model = models.get(name).clone();

    var box =  new THREE.Box3();
    box.setFromObject(model);

    model.userData.box = box;

    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshBasicMaterial(
        { color: 0xffff00, wireframe: true });
    //object.userData.cube = new THREE.Mesh( geometry, material );
    var cube = new THREE.Mesh( geometry, material );
    scene.add( cube );

    //скрытие объекта
    cube.material.visible = false;
    

    //получение позиции центра объекта
    var pos = new THREE.Vector3();
    box.getCenter(pos);
    //получение размеров объекта
    var size = new THREE.Vector3();
    box.getSize(size);

    //получение матрицы поворота объекта
    //cube.basis.extractRotation(model.matrixWorld);


    //установка позиции и размера объекта в куб
    cube.position.copy(pos);
    cube.scale.set(size.x, size.y, size.z);
    
    model.userData.cube = cube;
    cube.userData.model = model;

    var obb = {};
    //структура состоит из матрицы поворота, позиции и половины размера
    obb.basis = new THREE.Matrix4();
    obb.halfSize = new THREE.Vector3();
    obb.position = new THREE.Vector3();

    //получение позиции центра объекта
    box.getCenter(obb.position);
    //получение размеров объекта
    box.getSize(obb.halfSize).multiplyScalar(0.5);
    //получение матрицы поворота объекта
    obb.basis.extractRotation(model.matrixWorld);

    model.userData.obb = obb;

    objectList.push(cube);
    scene.add(model);
}



function intersect(ob1, ob2)
{
    var xAxisA = new THREE.Vector3();
    var yAxisA = new THREE.Vector3();
    var zAxisA = new THREE.Vector3();
    var xAxisB = new THREE.Vector3();
    var yAxisB = new THREE.Vector3();

    var zAxisB = new THREE.Vector3();
    var translation = new THREE.Vector3();
    var vector = new THREE.Vector3();

    var axisA = [];
    var axisB = [];
    var rotationMatrix = [ [], [], [] ];
    var rotationMatrixAbs = [ [], [], [] ];
    var _EPSILON = 1e-3;

    var halfSizeA, halfSizeB;
    var t, i;

    ob1.obb.basis.extractBasis( xAxisA, yAxisA, zAxisA );
    ob2.obb.basis.extractBasis( xAxisB, yAxisB, zAxisB );

    // push basis vectors into arrays, so you can access them via indices
    axisA.push( xAxisA, yAxisA, zAxisA );
    axisB.push( xAxisB, yAxisB, zAxisB );
    // get displacement vector
    vector.subVectors( ob2.obb.position, ob1.obb.position );
    // express the translation vector in the coordinate frame of the current
    // OBB (this)
    for ( i = 0; i < 3; i++ )
    {
    translation.setComponent( i, vector.dot( axisA[ i ] ) );
    }
    // generate a rotation matrix that transforms from world space to the
    // OBB's coordinate space
    for ( i = 0; i < 3; i++ )
    {
    for ( var j = 0; j < 3; j++ )
    {
    rotationMatrix[ i ][ j ] = axisA[ i ].dot( axisB[ j ] );
    rotationMatrixAbs[ i ][ j ] = Math.abs( rotationMatrix[ i ][ j ] ) + _EPSILON;
    }
    }
    // test the three major axes of this OBB
    for ( i = 0; i < 3; i++ )
    {
    vector.set( rotationMatrixAbs[ i ][ 0 ], rotationMatrixAbs[ i ][ 1 ], rotationMatrixAbs[ i ][ 2 ]
    );
    halfSizeA = ob1.obb.halfSize.getComponent( i );
    halfSizeB = ob2.obb.halfSize.dot( vector );
    

    if ( Math.abs( translation.getComponent( i ) ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    }
    // test the three major axes of other OBB
    for ( i = 0; i < 3; i++ )
    {
    vector.set( rotationMatrixAbs[ 0 ][ i ], rotationMatrixAbs[ 1 ][ i ], rotationMatrixAbs[ 2 ][ i ] );
    halfSizeA = ob1.obb.halfSize.dot( vector );
    halfSizeB = ob2.obb.halfSize.getComponent( i );
    vector.set( rotationMatrix[ 0 ][ i ], rotationMatrix[ 1 ][ i ], rotationMatrix[ 2 ][ i ] );
    t = translation.dot( vector );
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    }
    // test the 9 different cross-axes
    // A.x <cross> B.x
    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 0 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 0 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 1 ];
    t = translation.z * rotationMatrix[ 1 ][ 0 ] - translation.y * rotationMatrix[ 2 ][ 0 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.x < cross> B.y
    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 1 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 0 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 0 ];
    t = translation.z * rotationMatrix[ 1 ][ 1 ] - translation.y * rotationMatrix[ 2 ][ 1 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }

    // A.x <cross> B.z
    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 2 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 0 ][ 1 ] + ob2.obb.halfSize.y *
    rotationMatrixAbs[ 0 ][ 0 ];
    t = translation.z * rotationMatrix[ 1 ][ 2 ] - translation.y * rotationMatrix[ 2 ][ 2 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.y <cross> B.x
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 0 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 1 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 1 ];
    t = translation.x * rotationMatrix[ 2 ][ 0 ] - translation.z * rotationMatrix[ 0 ][ 0 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.y <cross> B.y
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 1 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 0 ];
    t = translation.x * rotationMatrix[ 2 ][ 1 ] - translation.z * rotationMatrix[ 0 ][ 1 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.y <cross> B.z
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 2 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 1 ] + ob2.obb.halfSize.y *
    rotationMatrixAbs[ 1 ][ 0 ];
    t = translation.x * rotationMatrix[ 2 ][ 2 ] - translation.z * rotationMatrix[ 0 ][ 2 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }

    // A.z <cross> B.x
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 0 ] + ob1.obb.halfSize.y *
    rotationMatrixAbs[ 0 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 2 ][ 1 ];
    t = translation.y * rotationMatrix[ 0 ][ 0 ] - translation.x * rotationMatrix[ 1 ][ 0 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.z <cross> B.y
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 1 ] + ob1.obb.halfSize.y *
    rotationMatrixAbs[ 0 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 2 ][ 0 ];
    t = translation.y * rotationMatrix[ 0 ][ 1 ] - translation.x * rotationMatrix[ 1 ][ 1 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.z <cross> B.z
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 2 ] + ob1.obb.halfSize.y *
    rotationMatrixAbs[ 0 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 1 ] + ob2.obb.halfSize.y *
    rotationMatrixAbs[ 2 ][ 0 ];
    t = translation.y * rotationMatrix[ 0 ][ 2 ] - translation.x * rotationMatrix[ 1 ][ 2 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // no separating axis exists, so the two OBB don't intersect
    return true;
}


//function addSprite ( name1, name2, Click )
function addButton ( name1, name2, Click )
{
    var texture1 = loader.load(name1)
    var material1 = new THREE.SpriteMaterial( { map: texture1 } );

    var texture2 = loader.load(name2)
    var material2 = new THREE.SpriteMaterial( { map: texture2 } );

    //console.log(material);

    //var width = material.map.image.width;
    //var height = material.map.image.height;
            
    sprite = new THREE.Sprite( material1);
    sprite.center.set( 0.0, 1.0 );
    sprite.scale.set( 80, 64, 1 );
    //sprite.position.set( 0, 0, 1 );

    //return sprite;

    sceneOrtho.add(sprite);
    //cameraOrtho.add(sprite);
    updateHUDSprite(sprite);

    var SSprite = {};
    SSprite.sprite = sprite;
    SSprite.mat1 = material1;
    SSprite.mat2 = material2;
    //SSprite.click =  sprtClick;
    SSprite.click =  Click;
      

    return SSprite;
}


//функция для обновления позиции спрайта
function updateHUDSprite(sprite)
{
 var width = window.innerWidth / 2;
 var height = window.innerHeight / 2;

 sprite.position.set( -width, height, 1 ); // левый верхний угол экрана
}

function addButtons()
{
    sprt = addButton ( 'pics/sprites/house.jpg', 'pics/sprites/house2.jpg', houseClick );
}

//moustPos = {x: 0, y:0}
function hitButton( mPos, sprite)
{
    var pw = sprite.sprite.position.x;
    var ph = sprite.sprite.position.y;
    var sw = pw + sprite.sprite.scale.x;
    var sh = ph - sprite.sprite.scale.y;

    if (mPos.x > pw && mPos.x < sw)
    {
        if (mPos.y < ph && mPos.y > sh)
        {
            sprite.sprite.material = sprite.mat2;
            //console.log(hit);
        }
    }
    else
        sprite.sprite.material = sprite.mat1;
}

function clickButton( mPos, sprite)
{
    var pw = sprite.sprite.position.x;
    var ph = sprite.sprite.position.y;
    var sw = pw + sprite.sprite.scale.x;
    var sh = ph - sprite.sprite.scale.y;

    if (mPos.x > pw && mPos.x < sw)
    {
        if (mPos.y < ph && mPos.y > sh)
        {
            sprite.click();
        }
    }
}

function houseClick()
{
    addMesh('house');
}

function createSpriteMaterial (name)
{
    var texture = loader.load(name)
    var material = new THREE.SpriteMaterial( { map: texture } );

    return material;
}

function addSprite ( mat, pos, lifetime )
{
            
    sprite = new THREE.Sprite( mat);
    sprite.center.set( 0.5, 0.5 );
    sprite.scale.set( 10, 10, 1 );

    sprite.position.copy(pos);

    scene.add(sprite);

    var SSprite = {};
    SSprite.sprite = sprite;
    SSprite.v = new THREE.Vector3 (0, 0, 0);
    SSprite.m = (Math.random() * 3) + 1;
    SSprite.lifetime = lifetime;
      
    return SSprite;
}

/*
function addSprite ( name, pos, lifetime )
{
    var texture = loader.load(name)
    var material = new THREE.SpriteMaterial( { map: texture } );

    //console.log(material);

    //var width = material.map.image.width;
    //var height = material.map.image.height;
            
    sprite = new THREE.Sprite( material);
    sprite.center.set( 0.5, 0.5 );
    sprite.scale.set( 10, 10, 1 );
    //sprite.position.set( 0, 0, 1 );

    //return sprite;

    sprite.position.copy(pos);

    scene.add(sprite);
    //cameraOrtho.add(sprite);
    //updateHUDSprite(sprite);

    var SSprite = {};
    SSprite.sprite = sprite;
    //SSprite.mat1 = material1;
    //SSprite.mat2 = material2;
    //SSprite.click =  sprtClick;
    //SSprite.click =  Click;
    SSprite.v = new THREE.Vector3 (0, 0, 0);
    SSprite.m = (Math.random() * 3) + 1;
    SSprite.lifetime = lifetime;
      

    return SSprite;
}
*/



function emitter (delta)
{
    // 1/60 - PARTICLES_PER_SECOND (100)

    var current_particles = Math.ceil (PARTICLES_PER_SECOND * delta);


    for (var i=0; i < current_particles; i ++)
    {
        if (particles.length < MAX_PARTICLES)
        {
            var x = Math.random()*N;
            var z =Math.random()*N;
    
            var lifetime = (Math.random() * 2 ) + 3;
    
            //var pos =new THREE.Vector4 (i*5, 20, N/2);
            var pos =new THREE.Vector4 (x, 70, z);
            var particle = addSprite(rainMAt, pos, lifetime );
    
            particles.push(particle);

            console.log("ADD PART");
        }
    }
    

    // p = p + (v + f; f = g * m)
    for (var i=0; i < particles.length; i++)
    {
        //particles[i].v = particles[i].v.add(g);
        //particles[i].sprite.position = particles[i].sprite.position.add(particles[i].v);

        particles[i].lifetime -=  delta;

        if (particles[i].lifetime <= 0)
        {
            scene.remove(particles[i].sprite);//extract sprite
            particles.slice (i, 1); //delete

            continue;
        }

        var gs = new THREE.Vector3();
        gs.copy(g);

        gs.multiplyScalar(particles[i].m);

        gs.multiplyScalar(delta);
        particles[i].v.add(gs);

        var v = new THREE.Vector3(0, 0, 0);
        var w = new THREE.Vector3(0, 0, 0);

        w.copy(wind);
        w.multiplyScalar(delta);

        v.copy(particles[i].v);
        v.add(w);

        particles[i].sprite.position.add(v);
    }
}