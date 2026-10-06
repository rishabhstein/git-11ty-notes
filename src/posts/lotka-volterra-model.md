---
title: Lotka Volterra model
cdate: 2025-11-18
mdate: 2026-10-06T17:14
date: Last Modified
tags:
  - physics
  - models
---
These models are very good for studying systems which show oscillatory behaviour such as predator-prey model. A simple example is the study of population growth of rabbit (R) and fox (F)[@Epstein1998book]. Rabbit eats grass and reproduce; Fox eats rabbit and reproduce. Fox can die and becomes dead fox (P)  It can be explained in the form of autocatalytic-type chemical reactions:
$$R + G \rightarrow 2R$$
$$F + R \rightarrow 2F$$
$$F \rightarrow P$$
Now the dynamics can be explained using PDEs:
$$\frac{dR}{dt} = k_xaG - k_yFR$$
$$\frac{dF}{dt} = k_yFR - k_dF$$
Here $k_x$ is the reaction rate for rabbit reproduction, $k_y$ specifies the rate of fox reproduction, and $k_d$ is the rate of fox death.  For any set of these constants, the numbers of rabbits and fox will oscillate with a period that depends on $k_x,k_y, k_d,$ and $a$.