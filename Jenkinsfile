pipeline {
    agent any

    environment {
        DOCKER_USER = 'dmartindev' 
        
        IMAGE_NAME = "${DOCKER_USER}/front-taller"
        registryCredential = 'docker-hub-credentials'
        DOCKER_BUILDKIT = '0'

        // Variables para Despliegue
        CONTAINER_NAME = 'angular-taller-deploy'
        APP_PORT = '8080'

        // Variables para Test (Quality Gate)
        CONTAINER_TEST = 'angular-app-test-temp'
        PORT_TEST = '8082'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                script {
                    echo "--- 🔨 Construyendo imagen: ${IMAGE_NAME} ---"
                    // Construye usando el Dockerfile de la raíz
                    sh "docker build --no-cache -t ${IMAGE_NAME}:latest ."
                    // Añade una etiqueta con el número de build (v1, v2, v3...)
                    sh "docker tag ${IMAGE_NAME}:latest ${IMAGE_NAME}:v${BUILD_NUMBER}"
                }
            }
        }

        stage('Quality Gate (Robot Framework)') {
            steps {
                script {
                    echo "--- ⬇️ Descargando tests ---"
                    sh "rm -rf pruebas-externas results"
                    sh "mkdir -p results"
                    
                    dir('pruebas-externas') {
                        git branch: 'main', url: 'https://github.com/VolumiDev/robot_taller_salesianos.git'
                    }

                    def NETWORK_NAME = "qa-network-${BUILD_NUMBER}"
                    def TEST_IMAGE_NAME = "robot-tests:${BUILD_NUMBER}"
                    
                    try {
                        // 1. Preparar Red y App
                        sh "docker network create ${NETWORK_NAME}"
                        sh "docker rm -f ${CONTAINER_TEST} || true"
                        sh "docker run -d --network ${NETWORK_NAME} --name ${CONTAINER_TEST} ${IMAGE_NAME}:latest"
                        
                        echo "--- ⏳ Esperando a que Angular inicie (10s) ---"
                        sleep 10 

                        // 2. CREAR IMAGEN DE TEST (La Solución)
                        // Creamos un Dockerfile al vuelo que mete los tests DENTRO de la imagen
                        echo "--- 📦 Empaquetando tests en imagen temporal ---"
                        sh """
                            echo 'FROM ppodgorsek/robot-framework:latest' > Dockerfile.test
                            echo 'USER root' >> Dockerfile.test
                            echo 'COPY pruebas-externas/tests /opt/robotframework/tests' >> Dockerfile.test
                            echo 'COPY pruebas-externas/resources /opt/robotframework/resources' >> Dockerfile.test
                        """
                        // Construimos la imagen con los tests ya dentro
                        sh "docker build -f Dockerfile.test -t ${TEST_IMAGE_NAME} ."

                        echo "--- 🤖 Ejecutando Robot Framework ---"
                        
                        // 3. EJECUTAR TEST
                        // Ya no usamos -v para el código fuente, solo necesitamos sacar el reporte
                        // El contenedor se ejecutará y parará. Si falla el test, el comando fallará.
                        try {
                            sh """
                              docker run --name robot-runner-${BUILD_NUMBER} \
                              --network ${NETWORK_NAME} \
                              -e ROBOT_TESTS_DIR=/opt/robotframework/tests/smoke.robot \
                              ${TEST_IMAGE_NAME}
                            """
                        } catch (Exception e) {
                            echo "⚠️ Los tests fallaron, pero vamos a extraer el reporte antes de cerrar."
                            currentBuild.result = 'FAILURE'
                            // Marcamos fallo pero dejamos seguir para sacar el reporte
                        }

                        // 4. EXTRAER REPORTES (Truco para evitar problemas de volumenes)
                        // Copiamos los resultados desde el contenedor muerto hacia Jenkins
                        sh "docker cp robot-runner-${BUILD_NUMBER}:/opt/robotframework/reports/. ${WORKSPACE}/results/"

                        // Verificamos si hubo fallo real
                        if (currentBuild.result == 'FAILURE') {
                             echo "❌ ERROR EN QA. Logs del contenedor Angular:"
                             sh "docker logs ${CONTAINER_TEST}"
                             error("Fallaron los tests de QA (Revisar carpeta results)")
                        }

                    } finally {
                        echo "--- 🧹 Limpieza de QA ---"
                        sh "docker rm -f ${CONTAINER_TEST} || true"
                        sh "docker rm -f robot-runner-${BUILD_NUMBER} || true"
                        sh "docker rmi ${TEST_IMAGE_NAME} || true"
                        sh "docker network rm ${NETWORK_NAME} || true"
                        sh "rm Dockerfile.test"
                    }
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    echo "--- 🚀 Subiendo a la nube ---"
                    // Se conecta a Docker Hub usando el Token guardado en Jenkins
                    withCredentials([usernamePassword(credentialsId: registryCredential, usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
                        sh 'echo $PASSWORD | docker login -u $USERNAME --password-stdin'
                        sh "docker push ${IMAGE_NAME}:latest"
                        sh "docker push ${IMAGE_NAME}:v${BUILD_NUMBER}"
                    }
                }
            }
        }
        
        stage('Deploy Local') {
            steps {
                script {
                    echo "--- 🔄 Actualizando contenedor local ---"
                    sh "docker rm -f ${CONTAINER_NAME} || true"
                    sh "docker run -d -p ${APP_PORT}:80 --name ${CONTAINER_NAME} ${IMAGE_NAME}:latest"
                }
            }
        }

        stage('Cleanup') {
            steps {
                script {
                    echo "--- 🧹 Limpieza ---"
                    sh "docker logout"
                    // Borra la imagen del entorno de Jenkins para ahorrar espacio
                    sh "docker rmi ${IMAGE_NAME}:latest || true"
                    sh "docker rmi ${IMAGE_NAME}:v${BUILD_NUMBER} || true"
                }
            }
        }
    }
}