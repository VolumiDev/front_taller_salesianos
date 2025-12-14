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
                    // Limpiamos el directorio antes de descargar para evitar conflictos
                    sh "rm -rf pruebas-externas"
                    
                    dir('pruebas-externas') {
                        git branch: 'main', url: 'https://github.com/VolumiDev/robot_taller_salesianos.git'
                    }

                    def NETWORK_NAME = "qa-network-${BUILD_NUMBER}"
                    
                    try {
                        sh "docker network create ${NETWORK_NAME}"
                        sh "docker rm -f ${CONTAINER_TEST} || true"
                        
                        // Esperamos un poco para asegurar que el contenedor app levante antes de lanzar el test
                        sh "docker run -d --network ${NETWORK_NAME} --name ${CONTAINER_TEST} ${IMAGE_NAME}:latest"
                        sleep 10 

                        echo "--- 🤖 Ejecutando Robot Framework ---"
                        
                        // CORRECCIÓN APLICADA AQUÍ: Montaje explícito de carpetas
                        sh """
                          docker run --rm --network ${NETWORK_NAME} -u 0 \
                          -e ROBOT_TESTS_DIR=/opt/robotframework/tests/smoke.robot \
                          -v ${WORKSPACE}/pruebas-externas/tests:/opt/robotframework/tests \
                          -v ${WORKSPACE}/pruebas-externas/resources:/opt/robotframework/resources \
                          -v ${WORKSPACE}/results:/opt/robotframework/reports \
                          ppodgorsek/robot-framework:latest
                        """

                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        echo "❌ ERROR EN QA. Logs del contenedor Angular:"
                        sh "docker logs ${CONTAINER_TEST}"
                        // Lanzamos el error para detener el pipeline
                        error("Fallaron los tests de QA: ${e.message}")
                    } finally {
                        sh "docker rm -f ${CONTAINER_TEST} || true"
                        sh "docker network rm ${NETWORK_NAME} || true"
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