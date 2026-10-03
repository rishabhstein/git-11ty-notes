---
title: Time scaling
cdate: 2025-12-30
date: Last Modified
tags:
  - physics
  - transport
---
One of the key confusions in non-dimensionlization process of a PDE is the interpretation of dimensionless numbers. I have observed two ways:

1. Comparing the magnitude of the terms
2. Comparing the time-scales of the terms

Both of them are analogous, while first one is more intuitive. Here I will explain the second method. Lets take an example of a transport equation for the case $A+B\rightarrow C$ where $A$ is injected in a *Hele-Shaw* cell at the center and cell is filled with $B$. The injection velocity is $v_r = Q/r$ where $Q$ is injection rate.

$$\frac{\partial A}{\partial t} +  v_r\frac{\partial A}{\partial r} = D\Big(\frac{1}{ r}\frac{\partial}{\partial r} + \frac{\partial^2}{\partial r^2}\Big)A - kAB$$
For non-dimensionlization of this equation we will use following scales: $A = A^*A_0$, $B = B^*A_0$, $t = t^*\tau$, and $r = r^*l$. Rewriting this equation and multiplying by $(1/A_0)$ leads to:

$$\frac{\partial A^*}{\partial t^*} +  \frac{Q \tau}{l^2}\frac{1}{r^*}\frac{\partial A^*}{\partial r^*} = \frac{D\tau}{l^2}\Big(\frac{1}{r^*}\frac{\partial}{\partial r^*} + \frac{\partial^2}{\partial r^{*2}}\Big)A^* -  A^*B^* kA_0\tau$$
Interestingly, three different time-scales appeared in all three terms: advection, diffusion and reaction. Now which one to choose? So lets consider the case of advection time scale, i.e. 
$$\tau = \tau_{adv} = \frac{l^2}{Q}$$
ADR:
$$\frac{\partial A^*}{\partial t^*} +  \frac{1}{r^*}\frac{\partial A^*}{\partial r^*} = \frac{1}{Pe}\Big(\frac{1}{r^*}\frac{\partial}{\partial r^*} + \frac{\partial^2}{\partial r^{*2}}\Big)A^* -  A^*B^* \frac{kA_0l^2}{Q}$$
where ${\rm Pe} = \frac{Q}{D}$ is [Peclet Number](peclet-number.md) and ${\rm Da} =\frac{Q}{kA_0l^2}$ is [[Damkohler number]]. In terms of time scales these numbers are:
$${\rm Pe} = \frac{t_{diff}}{t_{adv}} \hspace{1em} {\rm Da} = \frac{t_{adv}}{t_{rxn}} $$
Here, we compare all three process with respect to advection, as the time unit is based on advection. What it means is that in one advection unit time we can study other two processes.
	
Similarly for choosing reactive or diffusive time scales, the time unit will be based on corresponding process. One example of using reactive time scale is PRL of Brau et al [^1]. For that 
$$\tau = \tau_{rxn} = \frac{1}{kA_0}$$
The focus of this study was to study radial growth of precipitation. Reaction used in the study is fast so this assumption of using reactive-time scales makes sense.


References:

[^1]: *Flow Control of A + B → C Fronts by Radial Injection*, Fabian Brau, G. Schuszter, A. De Wit, 2017, [Link](brauFlowControlFronts2017.md), [DOI](10.1103/PhysRevLett.118.134101)