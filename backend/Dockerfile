FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml ./
COPY auth-core/pom.xml auth-core/pom.xml
COPY user-backend-app/pom.xml user-backend-app/pom.xml
COPY auth-core/src auth-core/src
COPY user-backend-app/src user-backend-app/src

RUN mvn -B -ntp -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /workspace/user-backend-app/target/user-backend-app-1.0.0-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

