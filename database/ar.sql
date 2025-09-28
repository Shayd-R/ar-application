-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Servidor: shared_mysql_db:3306
-- Tiempo de generación: 28-09-2025 a las 01:23:38
-- Versión del servidor: 5.7.44
-- Versión de PHP: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `ar`
--
CREATE DATABASE IF NOT EXISTS `ar` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `ar`;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `additional_images`
--

CREATE TABLE `additional_images` (
  `id_additional_image` int(11) NOT NULL,
  `id_work` int(11) DEFAULT NULL,
  `image_url` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `additional_images`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categories`
--

CREATE TABLE `categories` (
  `id_category` int(11) NOT NULL,
  `name_category` varchar(50) NOT NULL,
  `description_category` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `categories`
--

INSERT INTO `categories` (`id_category`, `name_category`, `description_category`, `created_at`, `updated_at`) VALUES
(1, 'Pintura', 'Obras realizadas con técnicas de pintura como óleo, acuarela, acrílico, etc.', '2025-04-19 00:04:07', '2025-04-19 00:04:07'),
(2, 'Escultura', 'Obras tridimensionales creadas mediante modelado, talla o ensamblaje', '2025-04-19 00:04:07', '2025-04-19 00:04:07'),
(3, 'Fotografía', 'Imágenes capturadas por medios fotográficos', '2025-04-19 00:04:07', '2025-04-19 00:04:07'),
(4, 'Ilustración', 'Dibujos e ilustraciones artísticas', '2025-04-19 00:04:07', '2025-04-19 00:04:07'),
(5, 'Arte Digital', 'Obras creadas o modificadas mediante herramientas digitales', '2025-04-19 00:04:07', '2025-04-19 00:04:07'),
(6, 'Técnica Mixta', 'Obras que combinan diferentes técnicas artísticas', '2025-04-19 00:04:07', '2025-04-19 00:04:07'),
(7, 'Instalación', 'Obras que modifican la percepción de un espacio', '2025-04-19 00:04:07', '2025-04-19 00:04:07'),
(8, 'Performance', 'Arte en vivo realizado por artistas', '2025-04-19 00:04:07', '2025-04-19 00:04:07'),
(9, 'Video Arte', 'Expresiones artísticas basadas en imágenes en movimiento', '2025-04-19 00:04:07', '2025-04-19 00:04:07'),
(10, 'Otro', 'Otras técnicas y categorías artísticas', '2025-04-19 00:04:07', '2025-04-19 00:04:07');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `links`
--

CREATE TABLE `links` (
  `id_link` int(11) NOT NULL,
  `id_work` int(11) DEFAULT NULL,
  `link_url` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_role` int(11) NOT NULL,
  `name_role` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_role`, `name_role`) VALUES
(1, 'admin'),
(2, 'artista');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `social_media`
--

CREATE TABLE `social_media` (
  `id_social_media` int(11) NOT NULL,
  `id_work` int(11) DEFAULT NULL,
  `platform` varchar(50) NOT NULL,
  `handle_or_url` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `social_media`
--
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tags`
--

CREATE TABLE `tags` (
  `id_tag` int(11) NOT NULL,
  `name_tag` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `tags`
--

INSERT INTO `tags` (`id_tag`, `name_tag`, `created_at`, `updated_at`) VALUES
(1, 'abstracto', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(2, 'realismo', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(3, 'contemporáneo', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(4, 'moderno', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(5, 'clásico', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(6, 'retrato', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(7, 'paisaje', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(8, 'urbano', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(9, 'minimalista', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(10, 'colorido', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(11, 'blanco y negro', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(12, 'figurativo', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(13, 'surrealista', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(14, 'impresionista', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(15, 'expresionista', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(16, 'conceptual', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(17, 'pop art', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(18, 'arte urbano', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(19, 'naturaleza', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(20, 'arquitectura', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(21, 'historia', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(22, 'social', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(23, 'político', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(24, 'experimental', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(25, 'tradicional', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(26, 'ilustración', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(27, 'diseño', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(28, '3D', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(29, 'multimedia', '2025-04-19 00:05:36', '2025-04-19 00:05:36'),
(30, 'interactivo', '2025-04-19 00:05:36', '2025-04-19 00:05:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id_user` int(11) NOT NULL,
  `id_role_user` int(11) DEFAULT NULL,
  `name_user` varchar(100) NOT NULL,
  `email_user` varchar(100) NOT NULL,
  `password_user` varchar(255) NOT NULL,
  `token_user` varchar(255) DEFAULT NULL,
  `token_exp_user` timestamp NULL DEFAULT NULL,
  `active_user` tinyint(4) NOT NULL DEFAULT '1',
  `created_at_user` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at_user` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id_user`, `id_role_user`, `name_user`, `email_user`, `password_user`, `token_user`, `token_exp_user`, `active_user`, `created_at_user`, `updated_at_user`) VALUES
(1, 1, 'admin', 'admin@gmail.com', '$2a$10$EJlg1VAFo33cBe/nkAwe5OLGW5ZmsGXc.AruwepymjuQmDUAYYreS', NULL, NULL, 1, '2025-04-18 23:39:09', '2025-05-02 12:30:43');


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `videos`
--

CREATE TABLE `videos` (
  `id_video` int(11) NOT NULL,
  `id_work` int(11) DEFAULT NULL,
  `video_url` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `video_type` enum('file','link') DEFAULT 'link'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `videos`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `works`
--

CREATE TABLE `works` (
  `id_work` int(11) NOT NULL,
  `id_user_work` int(11) DEFAULT NULL,
  `title_work` varchar(255) NOT NULL,
  `description_work` text,
  `url_image_work` varchar(255) DEFAULT NULL,
  `url_target_work` varchar(255) DEFAULT NULL,
  `id_category` int(11) DEFAULT NULL,
  `status_work` enum('activa','inactiva','pendiente por compilar','pendiente por rellenar formulario') NOT NULL,
  `created_at_work` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at_work` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `content_type` enum('image','video') DEFAULT 'image',
  `share_token` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `work_tags`
--

CREATE TABLE `work_tags` (
  `id_work` int(11) NOT NULL,
  `id_tag` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `work_tags`
--


--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `additional_images`
--
ALTER TABLE `additional_images`
  ADD PRIMARY KEY (`id_additional_image`),
  ADD KEY `id_work` (`id_work`);

--
-- Indices de la tabla `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id_category`),
  ADD UNIQUE KEY `name_category` (`name_category`);

--
-- Indices de la tabla `links`
--
ALTER TABLE `links`
  ADD PRIMARY KEY (`id_link`),
  ADD KEY `id_work` (`id_work`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_role`);

--
-- Indices de la tabla `social_media`
--
ALTER TABLE `social_media`
  ADD PRIMARY KEY (`id_social_media`),
  ADD KEY `id_work` (`id_work`);

--
-- Indices de la tabla `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id_tag`),
  ADD UNIQUE KEY `name_tag` (`name_tag`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `email_user` (`email_user`),
  ADD KEY `id_role_user` (`id_role_user`);

--
-- Indices de la tabla `videos`
--
ALTER TABLE `videos`
  ADD PRIMARY KEY (`id_video`),
  ADD KEY `id_work` (`id_work`);

--
-- Indices de la tabla `works`
--
ALTER TABLE `works`
  ADD PRIMARY KEY (`id_work`),
  ADD UNIQUE KEY `share_token` (`share_token`),
  ADD KEY `id_user_work` (`id_user_work`),
  ADD KEY `id_category` (`id_category`);

--
-- Indices de la tabla `work_tags`
--
ALTER TABLE `work_tags`
  ADD PRIMARY KEY (`id_work`,`id_tag`),
  ADD KEY `id_tag` (`id_tag`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `additional_images`
--
ALTER TABLE `additional_images`
  MODIFY `id_additional_image` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT de la tabla `categories`
--
ALTER TABLE `categories`
  MODIFY `id_category` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `links`
--
ALTER TABLE `links`
  MODIFY `id_link` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_role` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `social_media`
--
ALTER TABLE `social_media`
  MODIFY `id_social_media` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=141;

--
-- AUTO_INCREMENT de la tabla `tags`
--
ALTER TABLE `tags`
  MODIFY `id_tag` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `videos`
--
ALTER TABLE `videos`
  MODIFY `id_video` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=249;

--
-- AUTO_INCREMENT de la tabla `works`
--
ALTER TABLE `works`
  MODIFY `id_work` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `additional_images`
--
ALTER TABLE `additional_images`
  ADD CONSTRAINT `additional_images_ibfk_1` FOREIGN KEY (`id_work`) REFERENCES `works` (`id_work`);

--
-- Filtros para la tabla `links`
--
ALTER TABLE `links`
  ADD CONSTRAINT `links_ibfk_1` FOREIGN KEY (`id_work`) REFERENCES `works` (`id_work`);

--
-- Filtros para la tabla `social_media`
--
ALTER TABLE `social_media`
  ADD CONSTRAINT `social_media_ibfk_1` FOREIGN KEY (`id_work`) REFERENCES `works` (`id_work`);

--
-- Filtros para la tabla `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`id_role_user`) REFERENCES `roles` (`id_role`);

--
-- Filtros para la tabla `videos`
--
ALTER TABLE `videos`
  ADD CONSTRAINT `videos_ibfk_1` FOREIGN KEY (`id_work`) REFERENCES `works` (`id_work`);

--
-- Filtros para la tabla `works`
--
ALTER TABLE `works`
  ADD CONSTRAINT `works_ibfk_1` FOREIGN KEY (`id_user_work`) REFERENCES `users` (`id_user`),
  ADD CONSTRAINT `works_ibfk_2` FOREIGN KEY (`id_category`) REFERENCES `categories` (`id_category`);

--
-- Filtros para la tabla `work_tags`
--
ALTER TABLE `work_tags`
  ADD CONSTRAINT `work_tags_ibfk_1` FOREIGN KEY (`id_work`) REFERENCES `works` (`id_work`) ON DELETE CASCADE,
  ADD CONSTRAINT `work_tags_ibfk_2` FOREIGN KEY (`id_tag`) REFERENCES `tags` (`id_tag`) ON DELETE CASCADE;
