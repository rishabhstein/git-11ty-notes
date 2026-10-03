---
title: Pattern formation in maze
cdate: 2026-02-23
date: Last Modified
---
This study is mainly based on the thesis of Luka [^1] . The following steps were proposed:

0. **1D analytical solution of second order autocatalytic reaction $(A+B \rightarrow C)$** 
	$$\partial x / \partial t = \nabla^2x + x^2y \text{ and } \partial y / \partial t = \nabla^2y - x^2y$$

1. **Autocatalytic reaction front with in rectilinear geometry**
![](Pasted%20image%2020260223140709.png)


I have studied this problem from [Edward 2002](edwardsPoiseuilleAdvectionChemical2002.md) paper using my *Openfoam* solver as well as *Comsol*. I will present my non-dimensionalization--which is similar to [brauFlowControlFronts2017](brauFlowControlFronts2017.md)--of reaction-diffusion system first. Then I will show the result for 1D reaction-diffusion system with auto-catalytic reaction and validate it with analytical solution shown in [Luka's thesis](negrojevicDynamicChemicalFronts2025.md).

For an $2X + Y \rightarrow 3X$ type auto-catalytic equation, reaction diffusion equation is:

$$\frac{\partial \bar{x}}{\partial \bar{t}} +  \bar{v} \cdot \nabla \bar{x} = -D\nabla^2\bar{x} + k\bar{x}^2\bar{y}$$
where $x$ and $y$ are concentrations of reactant X and Y respectively. $\bar{v}$ is velocity field, $D$ is diffusion coefficient, and $k$ is reaction rate constant. Now for non-dimensionlization I introduce the scaling:
$$r = \frac{\bar{r}}{l}, t = \frac{\bar{t}}{\tau}, x = \frac{\bar{x}}{y_{0}}, y = \frac{\bar{y}}{y_{0}}, v = \frac{\bar{v}}{U_{0}}$$
Now my dimensionless equations for X is:

$$\frac{y_{0}}{\tau}\frac{\partial x}{\partial t} + \frac{y_{0}U_{0}}{l} v\cdot\nabla x = - \frac{y_{0}}{l^2} D\nabla^2x + ky_{0}^3x^2y$$
rearranging the terms:
$$\frac{\partial x}{\partial t} + \frac{U_{0}\tau}{l} v\cdot\nabla x = - \frac{\tau D}{l^2}\nabla^2x + (ky_{0}^2\tau) x^2y$$
Now the reactive time scale is: $$\tau = \frac{1}{ky^2_{0}}$$ based on the time scale, if we assume a large system ($L_{system} \gg l$) then an intrinsic length scale can be:
$$l = \sqrt{\tau D} = \sqrt{ \frac{D}{ky^2_{0}} }$$
The RDA becomes:

$$\frac{\partial x}{\partial t} + \frac{U_{0}}{c} v\cdot\nabla x = \nabla^2x + x^2y$$
where $c$ is reaction diffusion velocity $(= l/\tau)$. Similarly, to make the Stokes equation dimensionless :
$$\mu\nabla^2\bar{v} = \nabla \bar{p}$$
using the above scaling, and $p = \frac{\bar{p}}{p_{0}}$, the equation becomes:

$$\frac{\mu U_{0}}{l^2}\nabla^2 v = \frac{p_{0}}{l}\nabla p$$
rearranging the terms:
$$\frac{\mu U_{0}}{lp_{0}}\nabla^2 v =\nabla p$$
now we know from reaction-diffusion velocity $l = c \tau$, and assuming $p_{0} = \frac{\mu}{\tau}$:
$$\frac{U_{0}}{c}\nabla^2 v =\nabla p$$
Now similar to Luka's derivation if we assume the velocity scale is equal to reaction diffusion velocity ($U_{0} = c$) then the flow equation becomes:
$$\nabla^2 v = \nabla p$$
And the transport equation becomes:

$$\frac{\partial x}{\partial t} + v\cdot\nabla x = \nabla^2x + x^2y$$


---
Now I will discuss the results:
a. Reaction diffusion system without any advection:

i. Reaction front profiles:

![[front_position 1.png|279]]![[front_position.png|276]]
	  D = 1,  k = 1                                      D=2, k=2

ii: Front position with time.
![[Pasted image 20260416150215.png|335]]![[Pasted image 20260416150238.png|330]]
		D = 1, k = 1                                                   D=2, k=2


b. Simulation results for reaction-diffusion-advection model to validate Edwards paper:
	i. Front position with time: 
	scaled velocity = 2, and eta = 2:                                  eta = 4:
![[Pasted image 20260416150721.png|325]]![[Pasted image 20260416150941.png|325]]

   eta = 8                                                                                    eta = 16 
![[Pasted image 20260416151146.png|332]]![[Pasted image 20260416151325.png|331]]


2. **Influences of the dead ends**
![[Pasted image 20260729153929.png]]

Replicating results from Luka's thesis.

![[Occupancy_vs_Q_deandEnd_varying_Wb.png|411]]![[Occupancy_vs_Q_deandEnd_varying_Lb.png|419]]
- The system height $h = 2 (< w_f$  reaction front width), and length $l = 500$.
- $D_x = 1 = D_y$ and reaction rate $k = 1$
- Left plot shows occupancy vs flow rate curves with different dead-end widths $W_b$ (w in figure)
- Right plot shows occupancy vs flow rate curves with different dead-end heights $L_b$ (L in figure)

3. **Corners and Bifurcations**![](Pasted%20image%2020260223140826.png)
4. **Corner (L shape) instabilities (do they exist?)**![](Pasted%20image%2020260223140906.png)


References:
[^1]: *Influence of geometry and flows on the dynamics of chemical fronts*, L. Negrojević, 2025, [Link](/_references/negrojevicDynamicChemicalFronts2025), [DOI]